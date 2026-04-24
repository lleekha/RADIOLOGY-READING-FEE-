import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { 
  Printer, 
  Trash2, 
  RotateCcw, 
  Download, 
  Plus, 
  Shield, 
  LogOut, 
  Calendar, 
  User as UserIcon, 
  FileText, 
  Hash, 
  CreditCard, 
  Clock,
  AlertTriangle,
  AlertCircle,
  X,
  CheckCircle,
  CheckCircle2,
  Info,
  Settings,
  Edit2,
  Save,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Check,
  Copy,
  Square,
  CheckSquare,
  Database,
  Layers,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ClaimRecord {
  id: number;
  title: string;
  modality: string;
  date: string;
  rawDate: string;
  hospNo: string;
  name: string;
  givenName: string;
  middleName: string;
  surname: string;
  noMiddleName: boolean;
  exam: string;
  refNo: string;
  amount: string;
  reader: string;
  release: string;
  showReleaseSchedule: boolean;
  isDeleted: boolean;
  isPurged?: boolean;
  createdBy: string;
  createdAt: string;
  deletedBy?: string;
  deletedAt?: string;
  isPaid?: boolean;
  maifippReportedAt?: string;
  maifippServiceMonth?: string;
  philhealthNumber?: string;
  typeOfAssistance?: string;
  // New fields from Masters Logsheet
  numberPerDay?: string;
  or?: string;
  time?: string;
  age?: string;
  sex?: string;
  birthdate?: string;
  membership?: string;
  ward?: string;
  orNumber?: string;
  withOR?: boolean;
  address?: string;
  diagnosis?: string;
  cd?: string;
  cArm?: string;
  mobile?: string;
  remarks?: string;
  contactNo?: string;
  radiographer?: string;
  newRefNo?: string;
  oldRefNo?: string;
  requestingPhysician?: string;
  contrastMediaUsed?: string;
  pfAmount?: string;
  pfOrRefNo?: string;
  powerInjectorChargeNo?: string;
  cpNumber?: string;
  console?: string;
  examRoom?: string;
  recep?: string;
  sentBy?: string;
  transferResultBy?: string;
  patientStatus?: string;
  isReportedToMAIFIPP?: boolean;
}

interface ClaimSlipGeneratorProps {
  onLogout: () => void;
  username: string;
  userModality: string;
}

interface CompletorDropdownProps {
  field: string;
  label: string;
  items: string[];
  value: string;
  onSelect: (val: string) => void;
  onAddNew: () => void;
  incomplete: boolean;
  activeDropdown: string | null;
  setActiveDropdown: (val: string | null) => void;
  isDeleteMode: boolean;
  setIsDeleteMode: (val: boolean) => void;
  selectedItems: Set<string>;
  setSelectedItems: (val: Set<string>) => void;
  deleteMultipleItems: (field: string) => void;
  handleBackspaceClear: (e: React.KeyboardEvent, field: string) => void;
}

const CompletorDropdown = React.memo(({ 
  field, 
  label, 
  items, 
  value, 
  onSelect, 
  onAddNew,
  incomplete,
  activeDropdown,
  setActiveDropdown,
  isDeleteMode,
  setIsDeleteMode,
  selectedItems,
  setSelectedItems,
  deleteMultipleItems,
  handleBackspaceClear
}: CompletorDropdownProps) => {
  const isOpen = activeDropdown === field;
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter(item => 
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>
      <div className="relative">
        <button 
          onClick={() => {
            setActiveDropdown(isOpen ? null : field);
            setIsDeleteMode(false);
            setSelectedItems(new Set());
            setSearch('');
          }}
          onKeyDown={(e) => handleBackspaceClear(e, field)}
          className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-slate-700 flex items-center justify-between group shadow-sm ${
            incomplete 
              ? 'border-rose-500 bg-rose-50' 
              : isOpen 
                ? 'border-[#0a5c6e] bg-white ring-4 ring-cyan-50' 
                : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'
          }`}
        >
          <span className={`transition-colors ${!value ? 'text-slate-400' : 'text-slate-700'}`}>
            {value || `Select ${label}`}
          </span>
          <ChevronDown className={`w-5 h-5 transition-all duration-300 ${isOpen ? 'rotate-180 text-[#095161]' : 'text-slate-300 group-hover:text-slate-400'}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-[30000] bg-black/5 backdrop-blur-[1px]" 
                onClick={() => setActiveDropdown(null)} 
              />
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[30001] overflow-hidden"
              >
                <div className="p-3 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                  <div className="flex gap-2 mb-3">
                    {!isDeleteMode ? (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddNew();
                          }}
                          className="flex-1 py-2.5 bg-[#095161] text-white text-[10px] font-black rounded-xl hover:bg-[#0a5c6e] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/10"
                        >
                          <Plus className="w-3.5 h-3.5" /> ADD NEW
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteMode(true);
                          }}
                          className="flex-1 py-2.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> DELETE
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMultipleItems(field);
                          }}
                          disabled={selectedItems.size === 0}
                          className="flex-1 py-2.5 bg-rose-600 text-white text-[10px] font-black rounded-xl hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/10"
                        >
                          CONFIRM DELETE ({selectedItems.size})
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDeleteMode(false);
                            setSelectedItems(new Set());
                          }}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
                        >
                          CANCEL
                        </button>
                      </>
                    )}
                  </div>
                  <div className="relative group">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#095161] transition-colors" />
                    <input 
                      type="text"
                      autoFocus
                      placeholder={`Search ${label.toLowerCase()}...`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#095161] focus:bg-white transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                  {filteredItems.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-xs font-bold italic tracking-wide">No items found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {filteredItems.map(item => {
                        const isSelected = selectedItems.has(item);
                        const isCurrentActive = item === value && !isDeleteMode;
                        return (
                          <button
                            key={item}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isDeleteMode) {
                                const newSelected = new Set(selectedItems);
                                if (isSelected) newSelected.delete(item);
                                else newSelected.add(item);
                                setSelectedItems(newSelected);
                              } else {
                                onSelect(item);
                                setActiveDropdown(null);
                              }
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group active:scale-[0.98] ${
                              isSelected 
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                                : isCurrentActive
                                  ? 'bg-cyan-50 text-[#095161] border border-cyan-100'
                                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                            }`}
                          >
                            <span className="flex-1 pr-4 truncate">{item}</span>
                            {isDeleteMode && (
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isSelected ? 'bg-white border-white' : 'border-slate-300 group-hover:border-rose-400'}`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 stroke-[3]" />}
                              </div>
                            )}
                            {!isDeleteMode && isCurrentActive && (
                              <div className="bg-cyan-100 p-1 rounded-md">
                                <Check className="w-3.5 h-3.5 text-[#095161] stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

const RADIOLOGISTS = [
  "Dr. Frederik P. Aragon",
  "Dr. Christopher Joy A. Aromin",
  "Dr. Edgar R. Baniqued",
  "Dr. Daisy Anne P. Bautista",
  "Dr. Rhona C. Belarmino",
  "Dr. Mary Dulce Buyao-Catbagan",
  "Dr. Maribel M. Codamon",
  "Dr. Leah Theresa T. Cortez",
  "Dr. Justino Lorenzo M. Danguilan",
  "Dr. Alvin V. Dizon",
  "Dr. Tyrone S. Dulay",
  "Dr. Gervin Brian D. Espino",
  "Dr. Emma C. Estrada",
  "Dr. Joyal Liza G. Exiomo",
  "Dr. Kathlyn S. Flores",
  "Dr. Leonel Foronda",
  "Dr. Michellen D. Galang",
  "Dr. Loida A. Hora",
  "Dr. Maureen Lapuz",
  "Dr. Rey Anthony NF. Leung",
  "Dr. Charles Henri L. Molintas",
  "Dr. Rommel P. Mukay",
  "Dr. John Michael Joseph Y. Pineda",
  "Dr. Margarita C. Piluden",
  "Dr. Jayson T. Polahon",
  "Dr. Citadel Rabanes-Castillo",
  "Dr. Alvin Joshua Redoblado",
  "Dr. Buena Marie Redoblado",
  "Dr. Mary Jojit N. Rosendo",
  "Dr. Sunshine Soho-Ang",
  "Dr. Pauline Rizelle L. Toledo-Aycocho"
];

const PSGC_ADDRESSES = [
  "Abuyo, Alfonso Castañeda, Nueva Vizcaya",
  "Cauayan, Alfonso Castañeda, Nueva Vizcaya",
  "Galintuja, Alfonso Castañeda, Nueva Vizcaya",
  "Lipuga, Alfonso Castañeda, Nueva Vizcaya",
  "Lublub (Poblacion), Alfonso Castañeda, Nueva Vizcaya",
  "Pelaway, Alfonso Castañeda, Nueva Vizcaya",
  "Ammueg, Ambaguio, Nueva Vizcaya",
  "Camandag, Ambaguio, Nueva Vizcaya",
  "Dulli, Ambaguio, Nueva Vizcaya",
  "Labang, Ambaguio, Nueva Vizcaya",
  "Napo, Ambaguio, Nueva Vizcaya",
  "Poblacion, Ambaguio, Nueva Vizcaya",
  "Salingsingan, Ambaguio, Nueva Vizcaya",
  "Tiblac, Ambaguio, Nueva Vizcaya",
  "Anayo, Aritao, Nueva Vizcaya",
  "Baan, Aritao, Nueva Vizcaya",
  "Balite, Aritao, Nueva Vizcaya",
  "Banganan, Aritao, Nueva Vizcaya",
  "Beti, Aritao, Nueva Vizcaya",
  "Bone North, Aritao, Nueva Vizcaya",
  "Bone South, Aritao, Nueva Vizcaya",
  "Calitlitan, Aritao, Nueva Vizcaya",
  "Canabuan, Aritao, Nueva Vizcaya",
  "Canarem, Aritao, Nueva Vizcaya",
  "Comon, Aritao, Nueva Vizcaya",
  "Cutar, Aritao, Nueva Vizcaya",
  "Darapidap, Aritao, Nueva Vizcaya",
  "Kirang, Aritao, Nueva Vizcaya",
  "Latar-Nocnoc-San Francisco, Aritao, Nueva Vizcaya",
  "Nagcuartelan, Aritao, Nueva Vizcaya",
  "Ocao-Capiniaan, Aritao, Nueva Vizcaya",
  "Poblacion, Aritao, Nueva Vizcaya",
  "Santa Clara, Aritao, Nueva Vizcaya",
  "Tabueng, Aritao, Nueva Vizcaya",
  "Tucanon, Aritao, Nueva Vizcaya",
  "Yaway, Aritao, Nueva Vizcaya",
  "Bakir, Bagabag, Nueva Vizcaya",
  "Baretbet, Bagabag, Nueva Vizcaya",
  "Careb, Bagabag, Nueva Vizcaya",
  "Lantap, Bagabag, Nueva Vizcaya",
  "Murong, Bagabag, Nueva Vizcaya",
  "Nangalisan, Bagabag, Nueva Vizcaya",
  "Paniki, Bagabag, Nueva Vizcaya",
  "Pogonsino, Bagabag, Nueva Vizcaya",
  "Quirino, Bagabag, Nueva Vizcaya",
  "San Geronimo, Bagabag, Nueva Vizcaya",
  "San Pedro, Bagabag, Nueva Vizcaya",
  "Santa Cruz, Bagabag, Nueva Vizcaya",
  "Santa Lucia, Bagabag, Nueva Vizcaya",
  "Tapaya, Bagabag, Nueva Vizcaya",
  "Tuao North, Bagabag, Nueva Vizcaya",
  "Tuao South, Bagabag, Nueva Vizcaya",
  "Villa Coloma, Bagabag, Nueva Vizcaya",
  "Abian, Bambang, Nueva Vizcaya",
  "Abinganan, Bambang, Nueva Vizcaya",
  "Aliaga, Bambang, Nueva Vizcaya",
  "Almaguer North, Bambang, Nueva Vizcaya",
  "Almaguer South, Bambang, Nueva Vizcaya",
  "Banggot (Poblacion), Bambang, Nueva Vizcaya",
  "Barat, Bambang, Nueva Vizcaya",
  "Buag (Poblacion), Bambang, Nueva Vizcaya",
  "Calaocan, Bambang, Nueva Vizcaya",
  "Dullao, Bambang, Nueva Vizcaya",
  "Homestead, Bambang, Nueva Vizcaya",
  "Indiana, Bambang, Nueva Vizcaya",
  "Mabuslo, Bambang, Nueva Vizcaya",
  "Macate, Bambang, Nueva Vizcaya",
  "Magsaysay Hills, Bambang, Nueva Vizcaya",
  "Manamtam, Bambang, Nueva Vizcaya",
  "Mauan, Bambang, Nueva Vizcaya",
  "Pallas, Bambang, Nueva Vizcaya",
  "Salinas, Bambang, Nueva Vizcaya",
  "San Antonio North, Bambang, Nueva Vizcaya",
  "San Antonio South, Bambang, Nueva Vizcaya",
  "San Fernando, Bambang, Nueva Vizcaya",
  "San Leonardo, Bambang, Nueva Vizcaya",
  "Santo Domingo, Bambang, Nueva Vizcaya",
  "Santo Domingo West, Bambang, Nueva Vizcaya",
  "Bansing, Bayombong, Nueva Vizcaya",
  "Bonfal East, Bayombong, Nueva Vizcaya",
  "Bonfal Proper, Bayombong, Nueva Vizcaya",
  "Bonfal West, Bayombong, Nueva Vizcaya",
  "Buenavista (Vista Hills), Bayombong, Nueva Vizcaya",
  "Busilac, Bayombong, Nueva Vizcaya",
  "Cabuaan, Bayombong, Nueva Vizcaya",
  "Casat, Bayombong, Nueva Vizcaya",
  "District III (Poblacion), Bayombong, Nueva Vizcaya",
  "District IV (Poblacion), Bayombong, Nueva Vizcaya",
  "Don Domingo Maddela (Poblacion), Bayombong, Nueva Vizcaya",
  "Don Mariano Marcos, Bayombong, Nueva Vizcaya",
  "Don Tomas Maddela (Poblacion), Bayombong, Nueva Vizcaya",
  "Ipil-Cuneg, Bayombong, Nueva Vizcaya",
  "La Torre North, Bayombong, Nueva Vizcaya",
  "La Torre South, Bayombong, Nueva Vizcaya",
  "Luyang, Bayombong, Nueva Vizcaya",
  "Magapuy, Bayombong, Nueva Vizcaya",
  "Magsaysay, Bayombong, Nueva Vizcaya",
  "Masoc, Bayombong, Nueva Vizcaya",
  "Paitan, Bayombong, Nueva Vizcaya",
  "Salvacion, Bayombong, Nueva Vizcaya",
  "San Nicolas North, Bayombong, Nueva Vizcaya",
  "Santa Rosa, Bayombong, Nueva Vizcaya",
  "Vista Alegre, Bayombong, Nueva Vizcaya",
  "Ampakling, Diadi, Nueva Vizcaya",
  "Arwas, Diadi, Nueva Vizcaya",
  "Balete, Diadi, Nueva Vizcaya",
  "Bugnay, Diadi, Nueva Vizcaya",
  "Butao, Diadi, Nueva Vizcaya",
  "Decabacan, Diadi, Nueva Vizcaya",
  "Duruarog, Diadi, Nueva Vizcaya",
  "Escoting, Diadi, Nueva Vizcaya",
  "Langca, Diadi, Nueva Vizcaya",
  "Lurad, Diadi, Nueva Vizcaya",
  "Nagsabaran, Diadi, Nueva Vizcaya",
  "Namamparan, Diadi, Nueva Vizcaya",
  "Pinya, Diadi, Nueva Vizcaya",
  "Poblacion, Diadi, Nueva Vizcaya",
  "Rosario, Diadi, Nueva Vizcaya",
  "San Luis, Diadi, Nueva Vizcaya",
  "San Pablo, Diadi, Nueva Vizcaya",
  "Villa Aurora, Diadi, Nueva Vizcaya",
  "Villa Florentino, Diadi, Nueva Vizcaya",
  "Belance, Dupax del Norte, Nueva Vizcaya",
  "Binnuangan, Dupax del Norte, Nueva Vizcaya",
  "Bitnong, Dupax del Norte, Nueva Vizcaya",
  "Bulala, Dupax del Norte, Nueva Vizcaya",
  "Inaban, Dupax del Norte, Nueva Vizcaya",
  "Ineangan, Dupax del Norte, Nueva Vizcaya",
  "Lamo, Dupax del Norte, Nueva Vizcaya",
  "Mabasa, Dupax del Norte, Nueva Vizcaya",
  "Macabenga, Dupax del Norte, Nueva Vizcaya",
  "Malasin, Dupax del Norte, Nueva Vizcaya",
  "Munguia, Dupax del Norte, Nueva Vizcaya",
  "New Gumiad, Dupax del Norte, Nueva Vizcaya",
  "Oyao, Dupax del Norte, Nueva Vizcaya",
  "Parai, Dupax del Norte, Nueva Vizcaya",
  "Yabbi, Dupax del Norte, Nueva Vizcaya",
  "Abaca, Dupax del Sur, Nueva Vizcaya",
  "Bagumbayan, Dupax del Sur, Nueva Vizcaya",
  "Balsain, Dupax del Sur, Nueva Vizcaya",
  "Banila, Dupax del Sur, Nueva Vizcaya",
  "Biruk, Dupax del Sur, Nueva Vizcaya",
  "Canabay (Poblacion), Dupax del Sur, Nueva Vizcaya",
  "Carolotan, Dupax del Sur, Nueva Vizcaya",
  "Domang, Dupax del Sur, Nueva Vizcaya",
  "Dopaj, Dupax del Sur, Nueva Vizcaya",
  "Gabut, Dupax del Sur, Nueva Vizcaya",
  "Ganao, Dupax del Sur, Nueva Vizcaya",
  "Kimbutan, Dupax del Sur, Nueva Vizcaya",
  "Kinabuan, Dupax del Sur, Nueva Vizcaya",
  "Lukidnon, Dupax del Sur, Nueva Vizcaya",
  "Mangayang, Dupax del Sur, Nueva Vizcaya",
  "Palabotan, Dupax del Sur, Nueva Vizcaya",
  "Sanguit, Dupax del Sur, Nueva Vizcaya",
  "Santa Maria, Dupax del Sur, Nueva Vizcaya",
  "Talbek, Dupax del Sur, Nueva Vizcaya",
  "Alimit, Kasibu, Nueva Vizcaya",
  "Alloy, Kasibu, Nueva Vizcaya",
  "Antutot, Kasibu, Nueva Vizcaya",
  "Bilet, Kasibu, Nueva Vizcaya",
  "Binogawan, Kasibu, Nueva Vizcaya",
  "Biyoy, Kasibu, Nueva Vizcaya",
  "Bua, Kasibu, Nueva Vizcaya",
  "Camamasi, Kasibu, Nueva Vizcaya",
  "Capisa, Kasibu, Nueva Vizcaya",
  "Cordon, Kasibu, Nueva Vizcaya",
  "Dine, Kasibu, Nueva Vizcaya",
  "Kakiduguen, Kasibu, Nueva Vizcaya",
  "Kongkong, Kasibu, Nueva Vizcaya",
  "Lupa, Kasibu, Nueva Vizcaya",
  "Macalong, Kasibu, Nueva Vizcaya",
  "Malabing, Kasibu, Nueva Vizcaya",
  "Manguia, Kasibu, Nueva Vizcaya",
  "Muta, Kasibu, Nueva Vizcaya",
  "Nantawacan, Kasibu, Nueva Vizcaya",
  "Pacquet, Kasibu, Nueva Vizcaya",
  "Pao, Kasibu, Nueva Vizcaya",
  "Papaya, Kasibu, Nueva Vizcaya",
  "Poblacion, Kasibu, Nueva Vizcaya",
  "Pudi, Kasibu, Nueva Vizcaya",
  "Sanguit, Kasibu, Nueva Vizcaya",
  "Seguem, Kasibu, Nueva Vizcaya",
  "Tadji, Kasibu, Nueva Vizcaya",
  "Tiblac, Kasibu, Nueva Vizcaya",
  "Tokod, Kasibu, Nueva Vizcaya",
  "Topi, Kasibu, Nueva Vizcaya",
  "Wangal, Kasibu, Nueva Vizcaya",
  "Watwat, Kasibu, Nueva Vizcaya",
  "Acacia, Kayapa, Nueva Vizcaya",
  "Alang-Salacsac, Kayapa, Nueva Vizcaya",
  "Amilong-Labeng, Kayapa, Nueva Vizcaya",
  "Ansipsip, Kayapa, Nueva Vizcaya",
  "Baan, Kayapa, Nueva Vizcaya",
  "Babadi, Kayapa, Nueva Vizcaya",
  "Balangabang, Kayapa, Nueva Vizcaya",
  "Balete, Kayapa, Nueva Vizcaya",
  "Banao, Kayapa, Nueva Vizcaya",
  "Besong, Kayapa, Nueva Vizcaya",
  "Binalian, Kayapa, Nueva Vizcaya",
  "Buyasyas, Kayapa, Nueva Vizcaya",
  "Cabalatan-Alang, Kayapa, Nueva Vizcaya",
  "Cabanglasan, Kayapa, Nueva Vizcaya",
  "Cabayo, Kayapa, Nueva Vizcaya",
  "Castillo Village, Kayapa, Nueva Vizcaya",
  "Kayapa Proper East, Kayapa, Nueva Vizcaya",
  "Kayapa Proper West, Kayapa, Nueva Vizcaya",
  "Latbang, Kayapa, Nueva Vizcaya",
  "Lawigan, Kayapa, Nueva Vizcaya",
  "Mapayao, Kayapa, Nueva Vizcaya",
  "Nansiakan, Kayapa, Nueva Vizcaya",
  "Pampang, Kayapa, Nueva Vizcaya",
  "Pangawan, Kayapa, Nueva Vizcaya",
  "Pinayag, Kayapa, Nueva Vizcaya",
  "Pingkian, Kayapa, Nueva Vizcaya",
  "San Fabian, Kayapa, Nueva Vizcaya",
  "Talecabcab, Kayapa, Nueva Vizcaya",
  "Tidang Village, Kayapa, Nueva Vizcaya",
  "Tubongan, Kayapa, Nueva Vizcaya",
  "Aurora, Quezon, Nueva Vizcaya",
  "Baresbes, Quezon, Nueva Vizcaya",
  "Bonifacio, Quezon, Nueva Vizcaya",
  "Buliwao, Quezon, Nueva Vizcaya",
  "Caliat, Quezon, Nueva Vizcaya",
  "Dagupan, Quezon, Nueva Vizcaya",
  "Darubba, Quezon, Nueva Vizcaya",
  "Diffun, Quezon, Nueva Vizcaya",
  "Maasin, Quezon, Nueva Vizcaya",
  "Maddiangat, Quezon, Nueva Vizcaya",
  "Nalubbunan, Quezon, Nueva Vizcaya",
  "Runruno, Quezon, Nueva Vizcaya",
  "Atbu, Santa Fe, Nueva Vizcaya",
  "Bacneng, Santa Fe, Nueva Vizcaya",
  "Balete, Santa Fe, Nueva Vizcaya",
  "Baliling, Santa Fe, Nueva Vizcaya",
  "Bantinan, Santa Fe, Nueva Vizcaya",
  "Baracbac, Santa Fe, Nueva Vizcaya",
  "Buyasyas, Santa Fe, Nueva Vizcaya",
  "Canabuan, Santa Fe, Nueva Vizcaya",
  "Imugan, Santa Fe, Nueva Vizcaya",
  "Malico, Santa Fe, Nueva Vizcaya",
  "Poblacion, Santa Fe, Nueva Vizcaya",
  "Santa Rosa, Santa Fe, Nueva Vizcaya",
  "Sinapaoan, Santa Fe, Nueva Vizcaya",
  "Tactac, Santa Fe, Nueva Vizcaya",
  "Unib, Santa Fe, Nueva Vizcaya",
  "Villaflores, Santa Fe, Nueva Vizcaya",
  "Aggub, Solano, Nueva Vizcaya",
  "Bagahabag, Solano, Nueva Vizcaya",
  "Bangaan, Solano, Nueva Vizcaya",
  "Bangar, Solano, Nueva Vizcaya",
  "Bascaran, Solano, Nueva Vizcaya",
  "Communal, Solano, Nueva Vizcaya",
  "Concepcion, Solano, Nueva Vizcaya",
  "Curifang, Solano, Nueva Vizcaya",
  "Dadap, Solano, Nueva Vizcaya",
  "Lactawan, Solano, Nueva Vizcaya",
  "Mabasin, Solano, Nueva Vizcaya",
  "Osmeña, Solano, Nueva Vizcaya",
  "Poblacion North, Solano, Nueva Vizcaya",
  "Poblacion South, Solano, Nueva Vizcaya",
  "Quezon, Solano, Nueva Vizcaya",
  "Quirino, Solano, Nueva Vizcaya",
  "Roxas, Solano, Nueva Vizcaya",
  "San Juan, Solano, Nueva Vizcaya",
  "San Luis, Solano, Nueva Vizcaya",
  "Tucal, Solano, Nueva Vizcaya",
  "Uddiao, Solano, Nueva Vizcaya",
  "Wacal, Solano, Nueva Vizcaya",
  "Bintawan Norte, Villaverde, Nueva Vizcaya",
  "Bintawan Sur, Villaverde, Nueva Vizcaya",
  "Cabuluan, Villaverde, Nueva Vizcaya",
  "Ibung, Villaverde, Nueva Vizcaya",
  "Nagbitin, Villaverde, Nueva Vizcaya",
  "Ocapon, Villaverde, Nueva Vizcaya",
  "Pieza, Villaverde, Nueva Vizcaya",
  "Poblacion (Lower), Villaverde, Nueva Vizcaya",
  "Sawmill, Villaverde, Nueva Vizcaya",
  "Alicaocao, Cauayan City, Isabela",
  "Alinam, Cauayan City, Isabela",
  "Amobocan, Cauayan City, Isabela",
  "Andarayan, Cauayan City, Isabela",
  "Baculod, Cauayan City, Isabela",
  "Baringin Norte, Cauayan City, Isabela",
  "Baringin Sur, Cauayan City, Isabela",
  "Buena Suerte, Cauayan City, Isabela",
  "Bugallon, Cauayan City, Isabela",
  "Buyon, Cauayan City, Isabela",
  "Cabaruan, Cauayan City, Isabela",
  "Cabugao, Cauayan City, Isabela",
  "Aggasian, City of Ilagan, Isabela",
  "Alibagu, City of Ilagan, Isabela",
  "Allinguigan 1st, City of Ilagan, Isabela",
  "Allinguigan 2nd, City of Ilagan, Isabela",
  "Allinguigan 3rd, City of Ilagan, Isabela",
  "Arusip, City of Ilagan, Isabela",
  "Baculod (Poblacion), City of Ilagan, Isabela",
  "Bagong Silang, City of Ilagan, Isabela",
  "Baligatan, City of Ilagan, Isabela",
  "Abra, Santiago City, Isabela",
  "Ambalatungan, Santiago City, Isabela",
  "Balintocatoc, Santiago City, Isabela",
  "Banquero, Santiago City, Isabela",
  "Batal, Santiago City, Isabela",
  "Buenavista, Santiago City, Isabela",
  "Calao West, Santiago City, Isabela",
  "Dubinan East, Santiago City, Isabela",
  "Dubinan West, Santiago City, Isabela",
  "Amistad, Alicia, Isabela",
  "Antonino (Poblacion), Alicia, Isabela",
  "Apanay, Alicia, Isabela",
  "Aurora, Alicia, Isabela",
  "Bagnos, Alicia, Isabela",
  "Bagong Sikat, Alicia, Isabela",
  "Bantug-Petines, Alicia, Isabela",
  "Dagupan, Alicia, Isabela",
  "Aggub, Cabagan, Isabela",
  "Anao, Cabagan, Isabela",
  "Angancasilian, Cabagan, Isabela",
  "Balasig, Cabagan, Isabela",
  "Cansan, Cabagan, Isabela",
  "Casibarag Norte, Cabagan, Isabela",
  "Casibarag Sur, Cabagan, Isabela",
  "Catabayungan, Cabagan, Isabela",
  "Angoluan, Echague, Isabela",
  "Annafunan, Echague, Isabela",
  "Arabiat, Echague, Isabela",
  "Aromin, Echague, Isabela",
  "Babaran, Echague, Isabela",
  "Bacradal, Echague, Isabela",
  "Bangug, Echague, Isabela",
  "Annafunan East, Tuguegarao City, Cagayan",
  "Annafunan West, Tuguegarao City, Cagayan",
  "Bagay, Tuguegarao City, Cagayan",
  "Buntun, Tuguegarao City, Cagayan",
  "Caggay, Tuguegarao City, Cagayan",
  "Capatan, Tuguegarao City, Cagayan",
  "Cataggaman Nuevo, Tuguegarao City, Cagayan",
  "Cataggaman Pardo, Tuguegarao City, Cagayan",
  "Cataggaman Viejo, Tuguegarao City, Cagayan",
  "Centro 01 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 02 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 03 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 04 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 05 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 06 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 07 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 08 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 09 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 10 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 11 (Poblacion), Tuguegarao City, Cagayan",
  "Centro 12 (Poblacion), Tuguegarao City, Cagayan",
  "Larion Alto, Tuguegarao City, Cagayan",
  "Larion Bajo, Tuguegarao City, Cagayan",
  "Leonarda, Tuguegarao City, Cagayan",
  "Libag Norte, Tuguegarao City, Cagayan",
  "Libag Sur, Tuguegarao City, Cagayan",
  "Linao East, Tuguegarao City, Cagayan",
  "Linao Norte, Tuguegarao City, Cagayan",
  "Linao West, Tuguegarao City, Cagayan",
  "Namabbalan Norte, Tuguegarao City, Cagayan",
  "Namabbalan Sur, Tuguegarao City, Cagayan",
  "Pallua Norte, Tuguegarao City, Cagayan",
  "Pallua Sur, Tuguegarao City, Cagayan",
  "Pengue-Ruyu, Tuguegarao City, Cagayan",
  "San Gabriel, Tuguegarao City, Cagayan",
  "Tanza, Tuguegarao City, Cagayan",
  "Ugac Norte, Tuguegarao City, Cagayan",
  "Ugac Sur, Tuguegarao City, Cagayan",
  "Backiling, Aparri, Cagayan",
  "Bangag, Aparri, Cagayan",
  "Bisagu, Aparri, Cagayan",
  "Bukig, Aparri, Cagayan",
  "Bulala Norte, Aparri, Cagayan",
  "Bulala Sur, Aparri, Cagayan",
  "Centro 01 (Poblacion), Aparri, Cagayan",
  "Centro 02 (Poblacion), Aparri, Cagayan",
  "Dodan, Aparri, Cagayan",
  "Gaddang, Aparri, Cagayan",
  "Linao, Aparri, Cagayan",
  "Maura, Aparri, Cagayan",
  "Navayugan, Aparri, Cagayan",
  "Paddaya, Aparri, Cagayan",
  "Punta, Aparri, Cagayan",
  "San Antonio, Aparri, Cagayan",
  "San Jose, Aparri, Cagayan",
  "Toran, Aparri, Cagayan",
  "Ammubuan, Ballesteros, Cagayan",
  "Baran, Ballesteros, Cagayan",
  "Cabaritan East, Ballesteros, Cagayan",
  "Cabaritan West, Ballesteros, Cagayan",
  "Cabayu, Ballesteros, Cagayan",
  "Centro East (Poblacion), Ballesteros, Cagayan",
  "Centro West (Poblacion), Ballesteros, Cagayan",
  "Mabuttal East, Ballesteros, Cagayan",
  "Mabuttal West, Ballesteros, Cagayan",
  "Nararagan, Ballesteros, Cagayan",
  "Palloc, Ballesteros, Cagayan",
  "Payas, Ballesteros, Cagayan",
  "San Juan, Ballesteros, Cagayan",
  "Santa Cruz, Ballesteros, Cagayan",
  "Zitanga, Ballesteros, Cagayan",
  "Alaguia, Lal-lo, Cagayan",
  "Bagumbayan, Lal-lo, Cagayan",
  "Binag, Lal-lo, Cagayan",
  "Cabayabasan (Poblacion), Lal-lo, Cagayan",
  "Cagayan-Tana, Lal-lo, Cagayan",
  "Catayauan, Lal-lo, Cagayan",
  "Cullit, Lal-lo, Cagayan",
  "Dagupan, Lal-lo, Cagayan",
  "Lalafugan, Lal-lo, Cagayan",
  "Logac, Lal-lo, Cagayan",
  "Magapit, Lal-lo, Cagayan",
  "Malanao, Lal-lo, Cagayan",
  "Maxingal, Lal-lo, Cagayan",
  "Naguilian, Lal-lo, Cagayan",
  "San Jose, Lal-lo, Cagayan",
  "San Lorenzo, Lal-lo, Cagayan",
  "San Mariano, Lal-lo, Cagayan",
  "Andarayan Norte, Solana, Cagayan",
  "Andarayan Sur, Solana, Cagayan",
  "Bangag, Solana, Cagayan",
  "Bauan East, Solana, Cagayan",
  "Bauan West, Solana, Cagayan",
  "Calamagui, Solana, Cagayan",
  "Caruaruan, Solana, Cagayan",
  "Centro Norte (Poblacion), Solana, Cagayan",
  "Centro Sur (Poblacion), Solana, Cagayan",
  "Gadu, Solana, Cagayan",
  "Iraga, Solana, Cagayan",
  "Lanna, Solana, Cagayan",
  "Linglingay, Solana, Cagayan",
  "Nabbotuan, Solana, Cagayan",
  "Nangalisan, Solana, Cagayan",
  "Padul, Solana, Cagayan",
  "Paranza, Solana, Cagayan",
  "Sampaguita, Solana, Cagayan",
  "Ubong, Solana, Cagayan",
  "Acadia, Aglipay, Quirino",
  "Aurora, Aglipay, Quirino",
  "Cabua-an, Aglipay, Quirino",
  "Dagupan, Aglipay, Quirino",
  "Diodol, Aglipay, Quirino",
  "Dumabel, Aglipay, Quirino",
  "Dungo (Poblacion), Aglipay, Quirino",
  "Guisilib, Aglipay, Quirino",
  "Ligaya, Aglipay, Quirino",
  "Pinaripad Norte, Aglipay, Quirino",
  "Pinaripad Sur, Aglipay, Quirino",
  "Progreso, Aglipay, Quirino",
  "Ramos, Aglipay, Quirino",
  "San Antonio, Aglipay, Quirino",
  "San Francisco, Aglipay, Quirino",
  "San Leonardo, Aglipay, Quirino",
  "San Manuel, Aglipay, Quirino",
  "San Ramon, Aglipay, Quirino",
  "Victoria, Aglipay, Quirino",
  "Villa Pagaduan, Aglipay, Quirino",
  "Banuar, Cabarroguis, Quirino",
  "Burgos, Cabarroguis, Quirino",
  "Calaocan, Cabarroguis, Quirino",
  "Del Pilar, Cabarroguis, Quirino",
  "Dibibi, Cabarroguis, Quirino",
  "Eden, Cabarroguis, Quirino",
  "Gomez, Cabarroguis, Quirino",
  "Gundaway (Poblacion), Cabarroguis, Quirino",
  "Mangandingay, Cabarroguis, Quirino",
  "Mensidor, Cabarroguis, Quirino",
  "San Marcos, Cabarroguis, Quirino",
  "Santo Domingo, Cabarroguis, Quirino",
  "Tucod, Cabarroguis, Quirino",
  "Villamor, Cabarroguis, Quirino",
  "Villarose, Cabarroguis, Quirino",
  "Aurora, Diffun, Quirino",
  "Baguio Village, Diffun, Quirino",
  "Balagbag, Diffun, Quirino",
  "Bannawag, Diffun, Quirino",
  "Cajel, Diffun, Quirino",
  "Campamento, Diffun, Quirino",
  "Diego Silang, Diffun, Quirino",
  "Dumanisi, Diffun, Quirino",
  "Gulac, Diffun, Quirino",
  "Lanna, Diffun, Quirino",
  "Liwayway, Diffun, Quirino",
  "Magsaysay, Diffun, Quirino",
  "Makate, Diffun, Quirino",
  "Maria Clara, Diffun, Quirino",
  "Rafael Palma, Diffun, Quirino",
  "Ricarte Norte, Diffun, Quirino",
  "Ricarte Sur, Diffun, Quirino",
  "San Antonio, Diffun, Quirino",
  "San Isidro, Diffun, Quirino",
  "San Jose, Diffun, Quirino",
  "Villa Pascua, Diffun, Quirino",
  "Abbag, Maddela, Quirino",
  "Balligui, Maddela, Quirino",
  "Cabaruan, Maddela, Quirino",
  "Cabua-an, Maddela, Quirino",
  "Cofcaville, Maddela, Quirino",
  "Diduyon, Maddela, Quirino",
  "Dipintin, Maddela, Quirino",
  "Divisoria Norte, Maddela, Quirino",
  "Divisoria Sur, Maddela, Quirino",
  "Dumabato Norte, Maddela, Quirino",
  "Dumabato Sur, Maddela, Quirino",
  "Lusod, Maddela, Quirino",
  "Manglad, Maddela, Quirino",
  "Poblacion Norte, Maddela, Quirino",
  "Poblacion Sur, Maddela, Quirino",
  "San Pedro, Maddela, Quirino",
  "San Salvador, Maddela, Quirino",
  "Santo Niño, Maddela, Quirino",
  "Villa Aurora, Maddela, Quirino",
  "Villa Hermosa Norte, Maddela, Quirino",
  "Villa Hermosa Sur, Maddela, Quirino",
  "Ysmael, Maddela, Quirino",
  "Anak, Nagtipunan, Quirino",
  "Dipantan, Nagtipunan, Quirino",
  "Dissimungal, Nagtipunan, Quirino",
  "Guingin, Nagtipunan, Quirino",
  "La Concepcion, Nagtipunan, Quirino",
  "Landingan, Nagtipunan, Quirino",
  "Mataddi, Nagtipunan, Quirino",
  "Matmad, Nagtipunan, Quirino",
  "Old Gumiad, Nagtipunan, Quirino",
  "Pongo, Nagtipunan, Quirino",
  "San Dionisio II, Nagtipunan, Quirino",
  "San Pugo, Nagtipunan, Quirino",
  "Sangbay, Nagtipunan, Quirino",
  "Cardenas, Saguday, Quirino",
  "Gamis, Saguday, Quirino",
  "La Paz, Saguday, Quirino",
  "Magsaysay, Saguday, Quirino",
  "Rizal, Saguday, Quirino",
  "Salvacion, Saguday, Quirino",
  "Santo Tomas, Saguday, Quirino",
  "Tres Reyes, Saguday, Quirino",
  "Victoria, Saguday, Quirino",
  "Aduas Centro, Cabanatuan City, Nueva Ecija",
  "Aduas Norte, Cabanatuan City, Nueva Ecija",
  "Aduas Sur, Cabanatuan City, Nueva Ecija",
  "Bagong Sikat, Cabanatuan City, Nueva Ecija",
  "Bakod Bayan, Cabanatuan City, Nueva Ecija",
  "Bitas, Cabanatuan City, Nueva Ecija",
  "Caudillo, Cabanatuan City, Nueva Ecija",
  "Mabini Extension, Cabanatuan City, Nueva Ecija",
  "Mayapyap Norte, Cabanatuan City, Nueva Ecija",
  "Mayapyap Sur, Cabanatuan City, Nueva Ecija",
  "Sangitan East, Cabanatuan City, Nueva Ecija",
  "Sumacab Norte, Cabanatuan City, Nueva Ecija",
  "Sumacab Sur, Cabanatuan City, Nueva Ecija",
  "Valdefuente, Cabanatuan City, Nueva Ecija",
  "Balante, Gapan City, Nueva Ecija",
  "Bayanihan, Gapan City, Nueva Ecija",
  "Bulak, Gapan City, Nueva Ecija",
  "Castellano, Gapan City, Nueva Ecija",
  "Maburac, Gapan City, Nueva Ecija",
  "Mahipon, Gapan City, Nueva Ecija",
  "Pambuan, Gapan City, Nueva Ecija",
  "San Nicolas, Gapan City, Nueva Ecija",
  "San Roque, Gapan City, Nueva Ecija",
  "Santa Cruz, Gapan City, Nueva Ecija",
  "Santo Cristo Norte, Gapan City, Nueva Ecija",
  "Santo Cristo Sur, Gapan City, Nueva Ecija",
  "Atate, Palayan City, Nueva Ecija",
  "Caballero, Palayan City, Nueva Ecija",
  "Caimito, Palayan City, Nueva Ecija",
  "Ganaderia, Palayan City, Nueva Ecija",
  "Imelda Village, Palayan City, Nueva Ecija",
  "Langka, Palayan City, Nueva Ecija",
  "Maligaya, Palayan City, Nueva Ecija",
  "Marcos Village, Palayan City, Nueva Ecija",
  "Singalat, Palayan City, Nueva Ecija",
  "Abar 1st, San Jose City, Nueva Ecija",
  "Abar 2nd, San Jose City, Nueva Ecija",
  "Kita-Kita, San Jose City, Nueva Ecija",
  "Malasin, San Jose City, Nueva Ecija",
  "Palestina, San Jose City, Nueva Ecija",
  "Pinagpanaan, San Jose City, Nueva Ecija",
  "Rafael Rueda, Sr., San Jose City, Nueva Ecija",
  "Santo Niño 1st, San Jose City, Nueva Ecija",
  "Santo Niño 2nd, San Jose City, Nueva Ecija",
  "Tulay na Bato, San Jose City, Nueva Ecija",
  "Bantug, Science City of Muñoz, Nueva Ecija",
  "Bical, Science City of Muñoz, Nueva Ecija",
  "Catalanacan, Science City of Muñoz, Nueva Ecija",
  "Gabaldon, Science City of Muñoz, Nueva Ecija",
  "Labney, Science City of Muñoz, Nueva Ecija",
  "Linglingay, Science City of Muñoz, Nueva Ecija",
  "Magtanggol, Science City of Muñoz, Nueva Ecija",
  "Marigondon, Science City of Muñoz, Nueva Ecija",
  "Poblacion East, Science City of Muñoz, Nueva Ecija",
  "Poblacion West, Science City of Muñoz, Nueva Ecija",
  "Agcano, Guimba, Nueva Ecija",
  "Ayos Lomboy, Guimba, Nueva Ecija",
  "Bacayao, Guimba, Nueva Ecija",
  "Bagong Barrio, Guimba, Nueva Ecija",
  "Cavite, Guimba, Nueva Ecija",
  "Maturanoc, Guimba, Nueva Ecija",
  "Pacac, Guimba, Nueva Ecija",
  "Tampac 1st, Guimba, Nueva Ecija",
  "Bonifacio, San Leonardo, Nueva Ecija",
  "Castellano, San Leonardo, Nueva Ecija",
  "Magpapalayok, San Leonardo, Nueva Ecija",
  "Mallorca, San Leonardo, Nueva Ecija",
  "Nieves, San Leonardo, Nueva Ecija",
  "San Anton, San Leonardo, Nueva Ecija",
  "San Roque, San Leonardo, Nueva Ecija",
  "Tambo Adorable, San Leonardo, Nueva Ecija",
  "Bakal I, Talavera, Nueva Ecija",
  "Bakal II, Talavera, Nueva Ecija",
  "Bakal III, Talavera, Nueva Ecija",
  "Bantug Hacienda, Talavera, Nueva Ecija",
  "Bugtong na Buli, Talavera, Nueva Ecija",
  "Calipahan, Talavera, Nueva Ecija",
  "Dimasalang Norte, Talavera, Nueva Ecija",
  "Dimasalang Sur, Talavera, Nueva Ecija",
  "Pinagpanaan, Talavera, Nueva Ecija"
];

const DEFAULT_MODALITIES = [
  "X-RAY", 
  "X-RAY MAIN", 
  "X-RAY OPD", 
  "X-RAY PORTABLE",
  "MRI", 
  "MRI CONTRAST",
  "CT SCAN", 
  "CT SCAN MAIN", 
  "CT SCAN OPD", 
  "CT SCAN CONTRAST",
  "ULTRASOUND",
  "ULTRASOUND MAIN",
  "ULTRASOUND OPD",
  "DOPPLER",
  "MAMMOGRAPHY",
  "ECG",
  "2D ECHO",
  "STRESS TEST",
  "TREADMILL TEST",
  "HOLTER MONITORING",
  "EEG",
  "SPIROMETRY",
  "AUDIOMETRY",
  "ENDOSCOPY",
  "COLONOSCOPY",
  "BIOPSY",
  "BONE DENSITY",
  "PET SCAN",
  "NUCLEAR MEDICINE",
  "FLUOROSCOPY",
  "ANGIOGRAPHY"
];

const TEMPLATE_HEADERS = [
  "#",
  "Philhealth number",
  "Name of patients",
  "Hospital number",
  "Address",
  "Date of birth",
  "Age",
  "Gender",
  "Contact number",
  "Point of entry",
  "Type of assistance",
  "BILL (SOA #- PHIC CLASS/WARD) REFERENCE",
  "TOTAL AMOUNT",
  "Radiologist"
];

const RELEASE_TIMES = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM"
];

export default function ClaimSlipGenerator({ onLogout, username, userModality }: ClaimSlipGeneratorProps) {
  const isSuperAdmin = username === 'ADMIN';

  // Track user activity
  useEffect(() => {
    if (!username) return;

    const updateActivity = () => {
      const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');
      const updatedUsers = storedUsers.map((u: any) => {
        if (u.username === username) {
          return { ...u, lastActive: new Date().toISOString() };
        }
        return u;
      });
      localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
    };

    updateActivity(); // Initial update
    const interval = setInterval(updateActivity, 60000); // Every minute
    return () => clearInterval(interval);
  }, [username]);

  const handleAddModality = () => {
    const modName = modalityInput.toUpperCase().trim();
    if (modName && !modalities.includes(modName)) {
      const updated = [...modalities, modName];
      setModalities(updated);
      localStorage.setItem('claim_slip_modalities', JSON.stringify(updated));
      
      // Audit Log
      const newLog = {
        timestamp: new Date().toISOString(),
        user: username,
        action: 'SYSTEM_CONFIG',
        details: `Added new modality: ${modName}`
      };
      const updatedLogs = [newLog, ...systemLogs].slice(0, 100);
      setSystemLogs(updatedLogs);
      localStorage.setItem('claim_slip_logs', JSON.stringify(updatedLogs));
      setShowAddModalityModal(false);
      setModalityInput('');
      showToast(`Modality ${modName} added successfully`);
    } else if (modalities.includes(modName)) {
      showToast('Modality already exists', 'error');
    }
  };
  
  const clearUserHistory = (usernameToClear: string, selectedItems?: Set<string>, onConfirmSuccess?: () => void) => {
    const isSelective = selectedItems && selectedItems.size > 0;
    const confirmMsg = isSelective 
      ? `Are you sure you want to clear the ${selectedItems.size} selected login history items for ${usernameToClear}?`
      : `Are you sure you want to clear all login history for ${usernameToClear}? It will be stored in cleared history.`;

    setConfirmModal({
      show: true,
      title: isSelective ? 'Clear Selected History' : 'Clear All History',
      message: confirmMsg,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const storedUsers = JSON.parse(localStorage.getItem('claim_slip_users') || '[]');
        const updatedUsers = storedUsers.map((u: any) => {
          if (u.username === usernameToClear) {
            const currentHistory = u.loginHistory || [];
            const clearedHistory = u.clearedLoginHistory || [];
            
            if (isSelective) {
              const toMove = currentHistory.filter((h: any) => selectedItems.has(h.timestamp));
              const toKeep = currentHistory.filter((h: any) => !selectedItems.has(h.timestamp));
              return { 
                ...u, 
                loginHistory: toKeep, 
                clearedLoginHistory: [...toMove, ...clearedHistory] 
              };
            }

            return { 
              ...u, 
              loginHistory: [], 
              clearedLoginHistory: [...currentHistory, ...clearedHistory] 
            };
          }
          return u;
        });
        localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
        
        // Update selected user for history if it matches
        if (selectedUserForHistory?.username === usernameToClear) {
          const freshUser = updatedUsers.find((u: any) => u.username === usernameToClear);
          setSelectedUserForHistory(freshUser);
          setSelectedHistoryItems(new Set()); // Reset selection
        }
        
        showToast(isSelective ? `Selected history items cleared for ${usernameToClear}` : `History cleared for ${usernameToClear}`);

        // Audit Log
        const newLog = {
          timestamp: new Date().toISOString(),
          user: username,
          action: 'SYSTEM_CONFIG',
          details: isSelective 
            ? `Cleared ${selectedItems.size} selected login logs for ${usernameToClear}`
            : `Cleared all login logs for ${usernameToClear}`
        };
        const updatedLogs = [newLog, ...systemLogs].slice(0, 100);
        setSystemLogs(updatedLogs);
        localStorage.setItem('claim_slip_logs', JSON.stringify(updatedLogs));
        
        setConfirmModal(prev => ({ ...prev, show: false }));
        if (onConfirmSuccess) onConfirmSuccess();
      }
    });
  };

  const isSplitNameModality = (m: string) => {
    return m === 'CT SCAN MAIN' || m === 'CT SCAN OPD' || m === 'X-RAY MAIN';
  };

  const [activeTab, setActiveTab] = useState<'generator' | 'records' | 'users' | 'earnings'>('generator');
  const [earningsStartDate, setEarningsStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of current month
    return d.toISOString().split('T')[0];
  });
  const [earningsEndDate, setEarningsEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [modality, setModality] = useState(() => {
    if (username === 'ADMIN') return DEFAULT_MODALITIES[0];
    return userModality;
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Date filtering state
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ClaimRecord | 'none', direction: 'asc' | 'desc' }>({ key: 'none', direction: 'desc' });
  const [columnFilters, setColumnFilters] = useState<{[key: string]: string[]}>({});
  const [hospNo, setHospNo] = useState('');
  const [givenName, setGivenName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [name, setName] = useState('');
  const [exam, setExam] = useState('');
  const [refNo, setRefNo] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [age, setAge] = useState('');
  const [pointOfEntry, setPointOfEntry] = useState('OPD');
  const [philhealthNumber, setPhilhealthNumber] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [typeOfAssistance, setTypeOfAssistance] = useState('');

  const calculateAge = (bdate: string) => {
    if (!bdate) return "";
    const birthDate = new Date(bdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleBirthdateChange = (val: string) => {
    setBirthdate(val);
    setAge(calculateAge(val));
  };

  const [reader, setReader] = useState(() => {
    const match = RADIOLOGISTS.find(r => r.toLowerCase() === username.toLowerCase());
    return match || '';
  });

  const [attemptedExport, setAttemptedExport] = useState(false);
  const [exportSelectedRadiologists, setExportSelectedRadiologists] = useState<string[]>([]);
  const [isExportRadiologistDropdownOpen, setIsExportRadiologistDropdownOpen] = useState(false);

  const formatExportName = (r: ClaimRecord) => {
    const sName = r.surname || (r.name ? r.name.split(' ').slice(-1)[0] : '');
    const gName = r.givenName || (r.name ? r.name.split(' ').slice(0, -1).join(' ') : '');
    const mName = r.noMiddleName ? "" : (r.middleName || "");
    
    if (!sName && !gName) return (r.name || '').toUpperCase();
    
    return `${sName.toUpperCase()}, ${gName.toUpperCase()} ${mName.toUpperCase()}`.trim().replace(/\s+/g, ' ');
  };

  const getAvailableRadiologistsForExport = () => {
    const periodRecords = records.filter(r => {
      // Filter by modality for non-admins
      if (username !== 'ADMIN' && r.modality !== userModality) return false;

      // Filter by deletion status (match table logic)
      if (isAdminMode) {
        if (!r.isDeleted) return false;
      } else {
        if (r.isDeleted) return false;
      }
      
      if (r.isPurged && (username !== 'ADMIN' || !isAdminMode || !showPurged)) return false;

      // Filter by Paid status
      if (showOnlyPaid && !r.isPaid) return false;

      // Filter by selected modalities
      const recordModality = r.modality || (r.title ? r.title.split(' ')[0] : '');
      const selectedMods = columnFilters['modality'] || [];
      if (selectedMods.length > 0 && !selectedMods.includes(recordModality)) return false;

      // Filter by date range
      const rDate = r.rawDate || r.date;
      if (startDate || endDate) {
        if (!rDate) return false;
        if (startDate && rDate < startDate) return false;
        if (endDate && rDate > endDate) return false;
      }

      // Filter by Search (globalSearch)
      if (globalSearch && globalSearch.trim()) {
        const searchLower = globalSearch.trim().toLowerCase();
        const searchableFields = [
          r.name, r.hospNo, r.philhealthNumber, r.address, r.modality, r.reader, r.exam
        ].map(f => String(f || '').toLowerCase());
        if (!searchableFields.some(f => f.includes(searchLower))) return false;
      }

      // Column-specific filters
      for (const key in columnFilters) {
        if (key === 'reader' || key === 'modality') continue;
        const selectedValues = columnFilters[key];
        if (selectedValues && selectedValues.length > 0) {
          const recordVal = String((r as any)[key] || '');
          if (!selectedValues.includes(recordVal)) return false;
        }
      }
      
      return true;
    });

    // Extract names, normalize for de-duplication, but keep original case for display if possible
    // For simplicity and matching the user's "Red mark" expectation, we'll just take the unique values
    // but we should probably handle the case differences seen in the screenshot.
    const rawNames = periodRecords.map(r => r.reader).filter(Boolean);
    const uniqueNames: string[] = [];
    const seen = new Set();
    
    // Sort them first so we have consistent display names if casing varies
    rawNames.sort().forEach(name => {
      const upper = name.toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);
        uniqueNames.push(name);
      }
    });
    
    return uniqueNames;
  };
  const [newReaderName, setNewReaderName] = useState('');
  const [relDate, setRelDate] = useState(new Date().toISOString().split('T')[0]);
  const [relTime, setRelTime] = useState('1:00 PM - 3:00 PM');
  const [customTimeText, setCustomTimeText] = useState('');
  const [customTimeEnd, setCustomTimeEnd] = useState('');
  const [showReleaseSchedule, setShowReleaseSchedule] = useState(false);
  const [isOthersReader, setIsOthersReader] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [patientStatus, setPatientStatus] = useState('');

  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);
  const [tempColumnFilters, setTempColumnFilters] = useState<{[key: string]: string[]}>({});
  const [filterSearch, setFilterSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showOnlyPaid, setShowOnlyPaid] = useState(false);
  const [showPurged, setShowPurged] = useState(false);
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isExportPanelOpen, setIsExportPanelOpen] = useState(false);
  const [isModalityDropdownOpen, setIsModalityDropdownOpen] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [liveClock, setLiveClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getAutoAssistance = (poe: string, amt: string, mod: string) => {
    // Based on user request: Modality name minus MAIN/OPD, no longer defaulting to MAIFIPP for SW/0AMT
    const baseModality = mod.replace(/\s+(MAIN|OPD|CONTRAST|PORTABLE)$/i, '').trim();
    return baseModality;
  };

  useEffect(() => {
    if (modality) {
      setTypeOfAssistance(getAutoAssistance(pointOfEntry, amount, modality));
    }
  }, [modality, pointOfEntry, amount]);

  const [records, setRecords] = useState<ClaimRecord[]>(() => {
    const saved = localStorage.getItem('claim_slip_records');
    return saved ? JSON.parse(saved) : [];
  });
  const handleModalityChange = (usernameToUpdate: string, newModality: string) => {
    if (!isSuperAdmin) return;
    const updatedUsers = users.map(u => u.username === usernameToUpdate ? { ...u, modality: newModality } : u);
    setUsers(updatedUsers);
    localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
    showToast(`Modality updated for ${usernameToUpdate}`);
  };

  const [isAdminMode, setIsAdminMode] = useState(username === 'ADMIN');
  const [users, setUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('claim_slip_users');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (activeTab === 'users') {
      const saved = localStorage.getItem('claim_slip_users');
      setUsers(saved ? JSON.parse(saved) : []);
    }
  }, [activeTab]);

  const approveUser = (usernameToApprove: string) => {
    const updatedUsers = users.map(u => 
      u.username === usernameToApprove ? { ...u, isApproved: true } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
    setToast({ show: true, message: 'User approved successfully.', type: 'success' });
  };

  const deleteUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'ADMIN') {
      setToast({ show: true, message: 'Cannot delete ADMIN account.', type: 'error' });
      return;
    }
    const updatedUsers = users.filter(u => u.username !== usernameToDelete);
    setUsers(updatedUsers);
    localStorage.setItem('claim_slip_users', JSON.stringify(updatedUsers));
    setToast({ show: true, message: 'User removed successfully.', type: 'success' });
  };
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [wards, setWards] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_wards');
    const initial = saved ? JSON.parse(saved) : ["SW", "OPD", "ER"];
    return Array.from(new Set(initial));
  });
  const [physicians, setPhysicians] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_physicians');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });
  const [addresses, setAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_addresses');
    const initial = saved ? JSON.parse(saved) : PSGC_ADDRESSES;
    return Array.from(new Set(initial));
  });
  const [consoles, setConsoles] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_consoles');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });
  const [examRooms, setExamRooms] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_exam_rooms');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });
  const [receps, setReceps] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_receps');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });
  const [transferResultBys, setTransferResultBys] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_transfer_result_bys');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });
  const [radiologists, setRadiologists] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_radiologists');
    const initial = saved ? JSON.parse(saved) : RADIOLOGISTS;
    return Array.from(new Set(initial));
  });
  const [radiographers, setRadiographers] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_radiographers');
    const initial = saved ? JSON.parse(saved) : [];
    return Array.from(new Set(initial));
  });

  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [showAddPhysicianModal, setShowAddPhysicianModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showMaifippModal, setShowMaifippModal] = useState(false);
  const [selectedDoctorForMaifipp, setSelectedDoctorForMaifipp] = useState<string | null>(null);
  const [maifippSearch, setMaifippSearch] = useState('');
  const [maifippSelectedIds, setMaifippSelectedIds] = useState<Set<number>>(new Set());
  const [maifippBulkMonth, setMaifippBulkMonth] = useState(new Date().toISOString().slice(0, 7));
  const [maifippModalTab, setMaifippModalTab] = useState<'pending' | 'reported'>('pending');
  const [maifippHistoryFilter, setMaifippHistoryFilter] = useState('');
  const [showAddConsoleModal, setShowAddConsoleModal] = useState(false);
  const [showAddExamRoomModal, setShowAddExamRoomModal] = useState(false);
  const [showAddRecepModal, setShowAddRecepModal] = useState(false);
  const [showAddTransferResultByModal, setShowAddTransferResultByModal] = useState(false);
  const [showAddRadiologistModal, setShowAddRadiologistModal] = useState(false);
  const [showAddRadiographerModal, setShowAddRadiographerModal] = useState(false);

  const [newWardInput, setNewWardInput] = useState('');
  const [newPhysicianInput, setNewPhysicianInput] = useState('');
  const [newAddressInput, setNewAddressInput] = useState('');
  const [newConsoleInput, setNewConsoleInput] = useState('');
  const [newExamRoomInput, setNewExamRoomInput] = useState('');
  const [newRecepInput, setNewRecepInput] = useState('');
  const [newTransferResultByInput, setNewTransferResultByInput] = useState('');
  const [newRadiologistInput, setNewRadiologistInput] = useState('');
  const [newRadiographerInput, setNewRadiographerInput] = useState('');

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleBackspaceClear = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Backspace' && editingRecord) {
      setEditingRecord({ ...editingRecord, [field]: '' });
    }
  };

  const deleteMultipleItems = (field: string) => {
    const itemsToDelete = Array.from(selectedItems);
    if (itemsToDelete.length === 0) return;

    let updatedList: string[] = [];
    let storageKey = '';

    switch (field) {
      case 'ward':
        updatedList = wards.filter(w => !selectedItems.has(w));
        setWards(updatedList);
        storageKey = 'claim_slip_wards';
        break;
      case 'address':
        updatedList = addresses.filter(a => !selectedItems.has(a));
        setAddresses(updatedList);
        storageKey = 'claim_slip_addresses';
        break;
      case 'requestingPhysician':
        updatedList = physicians.filter(p => !selectedItems.has(p));
        setPhysicians(updatedList);
        storageKey = 'claim_slip_physicians';
        break;
      case 'console':
        updatedList = consoles.filter(c => !selectedItems.has(c));
        setConsoles(updatedList);
        storageKey = 'claim_slip_consoles';
        break;
      case 'examRoom':
        updatedList = examRooms.filter(e => !selectedItems.has(e));
        setExamRooms(updatedList);
        storageKey = 'claim_slip_exam_rooms';
        break;
      case 'recep':
        updatedList = receps.filter(r => !selectedItems.has(r));
        setReceps(updatedList);
        storageKey = 'claim_slip_receps';
        break;
      case 'transferResultBy':
        updatedList = transferResultBys.filter(t => !selectedItems.has(t));
        setTransferResultBys(updatedList);
        storageKey = 'claim_slip_transfer_result_bys';
        break;
      case 'radiographer':
        updatedList = radiographers.filter(r => !selectedItems.has(r));
        setRadiographers(updatedList);
        storageKey = 'claim_slip_radiographers';
        break;
      case 'reader':
        updatedList = radiologists.filter(r => !selectedItems.has(r));
        setRadiologists(updatedList);
        storageKey = 'claim_slip_radiologists';
        break;
    }

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      showToast(`${itemsToDelete.length} item(s) deleted successfully`);
      setSelectedItems(new Set());
      setIsDeleteMode(false);
    }
  };

  const getRecordCountForDay = (modality: string, date: string) => {
    return records.filter(r => r.modality === modality && r.date === date && !r.isDeleted).length + 1;
  };

  const [showWarning, setShowWarning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showModalityManager, setShowModalityManager] = useState(false);
  const [showAddModalityModal, setShowAddModalityModal] = useState(false);
  const [modalityInput, setModalityInput] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<any>(null);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [showClearedHistory, setShowClearedHistory] = useState(false);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ClaimRecord | null>(null);
  const [completorFilters, setCompletorFilters] = useState({
    modalities: [] as string[],
    startDate: '',
    endDate: ''
  });
  const [isCompletorModalityDropdownOpen, setIsCompletorModalityDropdownOpen] = useState(false);
  const [completorModalitySearch, setCompletorModalitySearch] = useState('');
  const [modalities, setModalities] = useState<string[]>(() => {
    if (username !== 'ADMIN') return [userModality];
    const saved = localStorage.getItem('claim_slip_modalities');
    return saved ? JSON.parse(saved) : DEFAULT_MODALITIES;
  });
  const [newModalityInput, setNewModalityInput] = useState('');
  const [editingModalityIndex, setEditingModalityIndex] = useState<number | null>(null);
  const [editingModalityValue, setEditingModalityValue] = useState('');
  const [systemLogs, setSystemLogs] = useState<any[]>(() => {
    return JSON.parse(localStorage.getItem('claim_slip_logs') || '[]');
  });
  
  const [printData, setPrintData] = useState<ClaimRecord | null>(null);
  const [selectedPrinter, setSelectedPrinter] = useState(() => {
    return localStorage.getItem('claim_slip_printer') || 'Local System Printer';
  });
  const [isChangingPrinter, setIsChangingPrinter] = useState(false);
  const handlePrintTicket = (data: ClaimRecord) => {
    const printWindow = window.open('', '_blank', 'width=800,height=800');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to print.', 'error');
      return;
    }

    const paperStyles = getPaperSizeStyles(printSettings.paperSize);
    const releaseInfo = data.showReleaseSchedule ? `
      <div class="release-box">
        <div class="release-text">RELEASE DATE & TIME:</div>
        <div class="release-text">${data.release.split(' @ ')[0]}</div>
        <div class="release-text">@ ${data.release.split(' @ ')[1].replace(' - ', ' to ')}</div>
      </div>
    ` : '';

    const ticketHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Claim Slip</title>
          <style>
            @page {
              margin: 0;
              size: ${printSettings.paperSize === 'A4 (Scaled)' ? 'A4' : 'auto'};
            }
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              background: white;
            }
            .slip-container {
              width: ${printSettings.paperSize === 'A4 (Scaled)' ? '3.5in' : paperStyles.width};
              height: ${printSettings.paperSize === 'A4 (Scaled)' ? 'auto' : paperStyles.height};
              padding: 0.1in;
              border: 1.5px solid black;
              box-sizing: border-box;
              position: relative;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              flex-direction: column;
              background: white;
              overflow: hidden;
              line-height: 1.1;
            }
            .qr-code {
              position: absolute;
              top: 2px;
              right: 2px;
              width: 38px;
              height: 38px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
              padding: 1px;
            }
            .qr-code img {
              width: 100% !important;
              height: 100% !important;
            }
            .header {
              margin-bottom: 2px;
              margin-right: 42px;
              border-bottom: 1.5px solid black;
              padding-bottom: 1px;
            }
            .header-top {
              font-weight: 900;
              font-size: 7pt;
              text-transform: uppercase;
              line-height: 1;
              display: block;
              overflow-wrap: anywhere;
            }
            .header-bottom {
              font-weight: 900;
              font-size: 7pt;
              text-transform: uppercase;
              line-height: 1;
              display: block;
              margin-top: 1px;
            }
            .content {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              gap: 0px;
              justify-content: space-evenly;
            }
            .field {
              display: flex;
              border-bottom: 0.5px solid #eee;
              padding-bottom: 0px;
              margin-bottom: 0px;
              align-items: flex-start;
              min-height: 9pt;
            }
            .field:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 900;
              font-size: 6pt;
              white-space: nowrap;
              margin-right: 4px;
              min-width: 42px;
              color: #000;
              text-transform: uppercase;
            }
            .value {
              font-family: 'Courier New', Courier, monospace;
              font-size: 6.5pt;
              font-weight: bold;
              text-transform: uppercase;
              flex-grow: 1;
              line-height: 1.1;
              overflow-wrap: anywhere;
              display: block;
              color: #000;
            }
            .release-box {
              margin-top: 2px;
              border: 1px solid red;
              padding: 2px;
              border-radius: 3px;
              text-align: center;
              background-color: #fffafa;
            }
            .release-text {
              color: red;
              font-weight: 900;
              font-size: 6pt;
              line-height: 1;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <div class="qr-code" id="qrcode"></div>
            <div class="header">
              <span class="header-top">${data.modality} OFFICIAL READING</span>
              <span class="header-bottom">CLAIM SLIP</span>
            </div>
            <div class="content">
              <div class="field"><span class="label">Date:</span><span class="value">${data.date}</span></div>
              <div class="field"><span class="label">Hosp No:</span><span class="value">${data.hospNo}</span></div>
              <div class="field"><span class="label">Name:</span><span class="value">${data.name}</span></div>
              <div class="field"><span class="label">Exam:</span><span class="value">${data.exam}</span></div>
              <div class="field"><span class="label">Ref No:</span><span class="value">${data.refNo}</span></div>
              <div class="field"><span class="label">Amount:</span><span class="value">${data.amount}</span></div>
              <div class="field"><span class="label">Reader:</span><span class="value">${data.reader}</span></div>
            </div>
            ${releaseInfo}
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            function adjustFontSize() {
              const container = document.querySelector('.slip-container');
              if (!container) return;
              
              const checkOverflow = () => {
                return container.scrollHeight > container.clientHeight || 
                       container.scrollWidth > container.clientWidth;
              };

              let fontSize = 6.5;
              let labelFontSize = 6;
              let headerFontSize = 7;
              
              // Start shrinking if it overflows
              // Added a small buffer and tighter decrements for smooth fit
              while (checkOverflow() && fontSize > 3.5) {
                fontSize -= 0.1;
                labelFontSize -= 0.08;
                headerFontSize -= 0.08;
                
                document.querySelectorAll('.value').forEach(el => el.style.fontSize = fontSize + 'pt');
                document.querySelectorAll('.label').forEach(el => el.style.fontSize = labelFontSize + 'pt');
                document.querySelectorAll('.header-top, .header-bottom').forEach(el => el.style.fontSize = headerFontSize + 'pt');
                document.querySelectorAll('.release-text').forEach(el => el.style.fontSize = (fontSize * 0.8) + 'pt');
              }
            }

            window.onload = () => {
              const qr = qrcode(0, 'M');
              qr.addData('${data.refNo || "N/A"}');
              qr.make();
              document.getElementById('qrcode').innerHTML = qr.createImgTag(3);
              
              // Adjust layout and font before printing to ensure nothing is cut
              adjustFontSize();
              
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(ticketHtml);
    printWindow.document.close();
  };

  const [printSettings, setPrintSettings] = useState(() => {
    const saved = localStorage.getItem('claim_slip_print_settings');
    return saved ? JSON.parse(saved) : {
      copies: 1,
      paperSize: '2x2 in',
      quality: 'High'
    };
  });

  useEffect(() => {
    localStorage.setItem('claim_slip_printer', selectedPrinter);
  }, [selectedPrinter]);

  useEffect(() => {
    localStorage.setItem('claim_slip_print_settings', JSON.stringify(printSettings));
  }, [printSettings]);

  const getPaperSizeStyles = (size: string) => {
    switch (size) {
      case '3x3 in':
        return { width: '3in', height: '3in' };
      case 'A4 (Scaled)':
        return { width: '210mm', height: '297mm', padding: '10mm' };
      case '2x2 in':
      default:
        return { width: '2in', height: '2in' };
    }
  };
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
    variant: 'danger' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const addModality = () => {
    const val = newModalityInput.trim().toUpperCase();
    if (!val) {
      showToast('Please enter a modality name', 'error');
      return;
    }
    if (modalities.some(m => m.toUpperCase() === val)) {
      showToast('Modality already exists', 'error');
      return;
    }
    setModalities(prev => [...prev, val]);
    setNewModalityInput('');
    showToast('Modality added successfully');
  };

  const deleteModality = (index: number) => {
    const modalityToDelete = modalities[index];
    setConfirmModal({
      show: true,
      title: 'Delete Modality',
      message: `Are you sure you want to remove "${modalityToDelete}" from the list?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const newModalities = modalities.filter((_, i) => i !== index);
        setModalities(newModalities);
        if (modality === modalityToDelete) setModality(newModalities[0] || '');
        showToast('Modality removed');
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const startEditingModality = (index: number) => {
    setEditingModalityIndex(index);
    setEditingModalityValue(modalities[index]);
  };

  const saveModalityEdit = () => {
    if (editingModalityIndex === null) return;
    const val = editingModalityValue.trim().toUpperCase();
    if (!val) return;
    
    const oldVal = modalities[editingModalityIndex];
    const newModalities = [...modalities];
    newModalities[editingModalityIndex] = val;
    setModalities(newModalities);
    
    if (modality === oldVal) setModality(val);
    
    setEditingModalityIndex(null);
    showToast('Modality updated');
  };

  // Persist records to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('claim_slip_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('claim_slip_modalities', JSON.stringify(modalities));
  }, [modalities]);

  const formatDate = (val: string) => {
    if (!val) return "";
    return new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const newInvalidFields = new Set<string>();
    
    if (!date) newInvalidFields.add('date');
    if (!hospNo) newInvalidFields.add('hospNo');
    if (!givenName) newInvalidFields.add('givenName');
    if (!noMiddleName && !middleName) newInvalidFields.add('middleName');
    if (!surname) newInvalidFields.add('surname');
    if (!exam) newInvalidFields.add('exam');
    if (!refNo) newInvalidFields.add('refNo');
    if (!amount || amount === '0.00') newInvalidFields.add('amount');
    if (!reader) newInvalidFields.add('reader');
    
    if (reader === "OTHERS" && !newReaderName) {
      newInvalidFields.add('newReaderName');
    }

    if (showReleaseSchedule) {
      if (!relDate) newInvalidFields.add('relDate');
      if (relTime === "CUSTOM") {
        if (!customTimeText) newInvalidFields.add('customTimeText');
        if (!customTimeEnd) newInvalidFields.add('customTimeEnd');
      }
    }

    if (newInvalidFields.size > 0) {
      setInvalidFields(newInvalidFields);
      setShowWarning(true);
      return;
    }

    setInvalidFields(new Set());
    
    let finalReader = reader;
    if (reader === "OTHERS") {
      finalReader = "Dr. " + newReaderName.toUpperCase();
    }

    let finalTime = relTime;
    if (relTime === "CUSTOM") {
      const formatTime = (timeStr: string) => {
        if (!timeStr.includes(':')) return timeStr;
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
      };

      finalTime = `${formatTime(customTimeText)} - ${formatTime(customTimeEnd)}`;
    }

    const fullName = `${givenName.toUpperCase()} ${noMiddleName ? '' : middleName.toUpperCase() + ' '}${surname.toUpperCase()}`.trim().replace(/\s+/g, ' ');

    const currentTime = liveClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const count = getRecordCountForDay(modality, formatDate(date));

    const newRecord: ClaimRecord = {
      id: Date.now(),
      title: `${modality} OFFICIAL READING CLAIM SLIP`,
      modality: modality,
      date: formatDate(date),
      rawDate: date,
      hospNo,
      name: fullName,
      givenName: givenName.toUpperCase(),
      middleName: noMiddleName ? '' : middleName.toUpperCase(),
      surname: surname.toUpperCase(),
      noMiddleName,
      exam: exam.toUpperCase(),
      refNo,
      amount: amount.startsWith('₱') ? amount : "₱ " + amount,
      reader: finalReader,
      release: `${formatDate(relDate)} @ ${finalTime}`,
      showReleaseSchedule,
      isDeleted: false,
      isPaid: false,
      createdBy: username,
      createdAt: new Date().toISOString(),
      // New fields from generator
      numberPerDay: count.toString(),
      or: '',
      time: currentTime,
      age: age,
      sex: sex,
      birthdate: birthdate,
      membership: '',
      ward: pointOfEntry,
      orNumber: '',
      address: address,
      diagnosis: '',
      cd: '',
      cArm: '',
      mobile: '',
      remarks: '',
      requestingPhysician: '',
      contrastMediaUsed: '',
      pfAmount: '',
      pfOrRefNo: '',
      withOR: false,
      powerInjectorChargeNo: '',
      cpNumber: '',
      console: '',
      examRoom: '',
      recep: '',
      sentBy: username,
      transferResultBy: '',
      patientStatus: patientStatus,
      philhealthNumber,
      typeOfAssistance,
      contactNo
    };

    setRecords([newRecord, ...records]);

    // Audit Log
    const newLog = {
      timestamp: new Date().toISOString(),
      user: username,
      action: 'CREATE',
      details: `Created record for ${newRecord.name} (${newRecord.refNo})`
    };
    const updatedLogs = [newLog, ...systemLogs].slice(0, 100);
    setSystemLogs(updatedLogs);
    localStorage.setItem('claim_slip_logs', JSON.stringify(updatedLogs));

    handlePrintTicket(newRecord);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  interface DoctorEarnings {
    doctor: string;
    totalRecords: number;
    totalAmount: number;
    totalMaifippAmount: number;
    totalPaidToCashierAmount: number;
    modalityBreakdown: { [modality: string]: { count: number; amount: number } };
  }

  const getDoctorEarnings = () => {
    const filtered = records.filter(r => {
      if (r.isDeleted) return false;
      if (username !== 'ADMIN' && r.modality !== userModality) return false;
      const recordDate = new Date(r.rawDate || r.date);
      const start = new Date(earningsStartDate);
      const end = new Date(earningsEndDate);
      end.setHours(23, 59, 59, 999);
      return recordDate >= start && recordDate <= end;
    });

    const earningsMap: { [doctor: string]: DoctorEarnings } = {};

    filtered.forEach(r => {
      const doctor = r.reader || 'Unknown';
      const amountStr = (r.amount || '0').replace(/[^\d.]/g, '');
      const amount = parseFloat(amountStr) || 0;
      const modality = r.modality || 'Unknown';

      if (!earningsMap[doctor]) {
        earningsMap[doctor] = {
          doctor,
          totalRecords: 0,
          totalAmount: 0,
          totalMaifippAmount: 0,
          totalPaidToCashierAmount: 0,
          modalityBreakdown: {}
        };
      }

      earningsMap[doctor].totalRecords += 1;
      earningsMap[doctor].totalAmount += amount;
      if (r.isReportedToMAIFIPP) {
        earningsMap[doctor].totalMaifippAmount += amount;
      }
      if (r.isPaid) {
        earningsMap[doctor].totalPaidToCashierAmount += amount;
      }

      if (!earningsMap[doctor].modalityBreakdown[modality]) {
        earningsMap[doctor].modalityBreakdown[modality] = { count: 0, amount: 0 };
      }
      earningsMap[doctor].modalityBreakdown[modality].count += 1;
      earningsMap[doctor].modalityBreakdown[modality].amount += amount;
    });

    return Object.values(earningsMap).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const exportEarningsToExcel = () => {
    const filtered = records.filter(r => {
      if (r.isDeleted) return false;
      if (username !== 'ADMIN' && r.modality !== userModality) return false;
      const recordDate = new Date(r.rawDate || r.date);
      const start = new Date(earningsStartDate);
      const end = new Date(earningsEndDate);
      end.setHours(23, 59, 59, 999);
      return recordDate >= start && recordDate <= end;
    });

    const worksheetData = filtered.map(r => {
      const amount = parseFloat((r.amount || r.pfAmount || '0').replace(/[^\d.]/g, '')) || 0;
      return {
        'RADIOLOGIST': (r.reader || 'Unknown').toUpperCase(),
        'NAME OF PATIENT': formatExportName(r),
        'REFERENCE NO.': r.refNo,
        'PAID TO CASHIER': r.isPaid ? amount : 0,
        'REPORTED TO MAIFIPP': r.isReportedToMAIFIPP ? amount : 0,
        'NOT YET PAID': (!r.isPaid && !r.isReportedToMAIFIPP) ? amount : 0,
        'TOTAL EARNINGS': amount
      };
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Doctor Fees Records");
    XLSX.writeFile(wb, `Doctor_Fees_Records_${earningsStartDate}_to_${earningsEndDate}.xlsx`);
    showToast('Detailed records exported to Excel');
  };

  const exportEarningsToPDF = () => {
    const filtered = records.filter(r => {
      if (r.isDeleted) return false;
      if (username !== 'ADMIN' && r.modality !== userModality) return false;
      const recordDate = new Date(r.rawDate || r.date);
      const start = new Date(earningsStartDate);
      const end = new Date(earningsEndDate);
      end.setHours(23, 59, 59, 999);
      return recordDate >= start && recordDate <= end;
    });

    const doc = new jsPDF('l', 'mm', 'a4'); // Use landscape for detailed list
    
    doc.setFontSize(18);
    doc.text('Doctor Fees Detailed Records', 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${earningsStartDate} to ${earningsEndDate}`, 14, 22);

    const tableData = filtered.map(r => {
      const amount = parseFloat((r.amount || r.pfAmount || '0').replace(/[^\d.]/g, '')) || 0;
      return [
        (r.reader || 'Unknown').toUpperCase(),
        formatExportName(r),
        r.refNo,
        r.isPaid ? amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00',
        r.isReportedToMAIFIPP ? amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00',
        (!r.isPaid && !r.isReportedToMAIFIPP) ? amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00',
        amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['RADIOLOGIST', 'NAME OF PATIENT', 'REFERENCE NO.', 'PAID TO CASHIER', 'REPORTED TO MAIFIPP', 'NOT YET PAID', 'TOTAL EARNINGS']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 162, 194] },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const val = parseFloat(data.cell.text[0].replace(/,/g, '')) || 0;
          if (val > 0) {
            data.cell.styles.textColor = [239, 68, 68]; // Red-500
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    doc.save(`Doctor_Fees_Records_${earningsStartDate}_to_${earningsEndDate}.pdf`);
    showToast('Detailed records exported to PDF');
  };

  const onPreviewClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInvalidFields = new Set<string>();
    if (!date) newInvalidFields.add('date');
    if (!hospNo) newInvalidFields.add('hospNo');
    if (!givenName) newInvalidFields.add('givenName');
    if (!noMiddleName && !middleName) newInvalidFields.add('middleName');
    if (!surname) newInvalidFields.add('surname');
    if (!exam) newInvalidFields.add('exam');
    if (!refNo) newInvalidFields.add('refNo');
    if (!amount || amount === '0.00') newInvalidFields.add('amount');
    if (!reader) newInvalidFields.add('reader');
    if (reader === "OTHERS" && !newReaderName) newInvalidFields.add('newReaderName');
    if (showReleaseSchedule) {
      if (!relDate) newInvalidFields.add('relDate');
      if (relTime === "CUSTOM") {
        if (!customTimeText) newInvalidFields.add('customTimeText');
        if (!customTimeEnd) newInvalidFields.add('customTimeEnd');
      }
    }

    if (newInvalidFields.size > 0) {
      setInvalidFields(newInvalidFields);
      setShowWarning(true);
      return;
    }

    setConfirmModal({
      show: true,
      title: 'Confirm Action',
      message: 'Do you want to proceed?',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, show: false }));
        handleSubmit();
      },
      confirmText: 'Yes, Proceed',
      cancelText: 'Cancel',
      variant: 'info'
    });
  };

  const clearForm = () => {
    setHospNo('');
    setGivenName('');
    setMiddleName('');
    setSurname('');
    setNoMiddleName(false);
    setName('');
    setExam('');
    setRefNo('');
    setAmount('0.00');
    setReader('');
    setNewReaderName('');
    setRelTime('1:00 PM - 3:00 PM');
    setCustomTimeText('');
    setCustomTimeEnd('');
    setShowReleaseSchedule(false);
    setIsOthersReader(false);
    setIsCustomTime(false);
    setPatientStatus('');
    setAddress('');
    setSex('');
    setBirthdate('');
    setAge('');
    setPointOfEntry('OPD');
    setPhilhealthNumber('');
    setContactNo('');
    setTypeOfAssistance('');
    setInvalidFields(new Set());
  };

  const deleteRecord = (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Delete Record',
      message: 'Move this record to the trash? You can restore it later in Admin Mode.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        const recordToDelete = records.find(r => r.id === id);
        setRecords(prev => prev.map(r => r.id === id ? { 
          ...r, 
          isDeleted: true,
          deletedBy: username,
          deletedAt: new Date().toISOString()
        } : r));
        showToast('Record moved to trash');
        setConfirmModal(prev => ({ ...prev, show: false }));

        // Audit Log
        const newLog = {
          timestamp: new Date().toISOString(),
          user: username,
          action: 'DELETE',
          details: `Deleted record for ${recordToDelete?.name} (${recordToDelete?.refNo})`
        };
        const updatedLogs = [newLog, ...systemLogs].slice(0, 100);
        setSystemLogs(updatedLogs);
        localStorage.setItem('claim_slip_logs', JSON.stringify(updatedLogs));
      }
    });
  };

  const restoreRecord = (id: number) => {
    setRecords(records.map(r => r.id === id ? { 
      ...r, 
      isDeleted: false, 
      isPurged: false,
      deletedBy: undefined,
      deletedAt: undefined
    } : r));
    showToast('Record restored successfully');
  };

  const togglePaidStatus = (id: number) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, isPaid: !r.isPaid } : r));
    const record = records.find(r => r.id === id);
    if (record) {
      showToast(!record.isPaid ? 'Marked as Paid' : 'Marked as Unpaid', !record.isPaid ? 'success' : 'info');
    }
  };

  const getUniqueValues = (key: string) => {
    if (key === 'modality') {
      const values = modalities.filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()));
      return Array.from(new Set(values)).sort();
    }
    const values = records
      .filter(r => isAdminMode ? r.isDeleted : !r.isDeleted)
      .map(r => String((r as any)[key] || ''))
      .filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()));
    return Array.from(new Set(values)).sort();
  };

  const toggleFilter = (key: string) => {
    if (openFilterKey === key) {
      setOpenFilterKey(null);
      setFilterSearch('');
    } else {
      setOpenFilterKey(key);
      setFilterSearch('');
      setTempColumnFilters({
        ...tempColumnFilters,
        [key]: columnFilters[key] || []
      });
    }
  };

  const applyFilter = (key: string) => {
    setColumnFilters({
      ...columnFilters,
      [key]: tempColumnFilters[key] || []
    });
    setOpenFilterKey(null);
    setFilterSearch('');
  };

  const clearFilter = (key: string) => {
    setTempColumnFilters({
      ...tempColumnFilters,
      [key]: []
    });
  };

  const selectAllFilter = (key: string) => {
    let uniqueValues;
    if (key === 'modality') {
      uniqueValues = modalities;
    } else {
      uniqueValues = records
        .filter(r => !r.isDeleted || isAdminMode)
        .map(r => String((r as any)[key] || ''));
    }
    setTempColumnFilters({
      ...tempColumnFilters,
      [key]: Array.from(new Set(uniqueValues))
    });
  };

  const toggleTempFilterValue = (key: string, value: string) => {
    const current = tempColumnFilters[key] || [];
    if (current.includes(value)) {
      setTempColumnFilters({
        ...tempColumnFilters,
        [key]: current.filter(v => v !== value)
      });
    } else {
      setTempColumnFilters({
        ...tempColumnFilters,
        [key]: [...current, value]
      });
    }
  };
  const permanentDelete = (id: number) => {
    setConfirmModal({
      show: true,
      title: 'Permanent Delete',
      message: 'CRITICAL: This will permanently erase this record. This action cannot be undone!',
      confirmText: 'Purge Data',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setRecords(prev => prev.map(r => r.id === id ? { ...r, isPurged: true, isDeleted: true } : r));
        showToast('Record permanently deleted', 'error');
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };


  const filteredRecords = records.filter(r => {
    // Filter by modality for non-admins
    if (username !== 'ADMIN' && r.modality !== userModality) return false;

    // Filter by deletion status:
    // If Admin Mode is ON, only show deleted records.
    // If Admin Mode is OFF, only show non-deleted records.
    if (isAdminMode) {
      if (!r.isDeleted) return false;
    } else {
      if (r.isDeleted) return false;
    }
    
    // Hide purged records unless user is ADMIN, in admin mode, and showPurged is enabled
    if (r.isPurged && (username !== 'ADMIN' || !isAdminMode || !showPurged)) return false;

    // Filter by Paid status
    if (showOnlyPaid && !r.isPaid) return false;

    // Filter by selected modalities
    const recordModality = r.modality || (r.title ? r.title.split(' ')[0] : '');
    const selectedModalities = columnFilters['modality'] || [];
    if (selectedModalities.length > 0 && !selectedModalities.includes(recordModality)) return false;

    // Filter by Radiologist from Export Panel (functions like a filter)
    if (exportSelectedRadiologists.length > 0 && !exportSelectedRadiologists.includes(r.reader || '')) return false;
    
    // Filter by date range if specified
    if (startDate || endDate) {
      const d = r.rawDate ? new Date(r.rawDate) : (r.date ? new Date(r.date) : null);
      if (!d || isNaN(d.getTime())) return false;
      
      const recordTime = d.getTime();
      if (startDate && recordTime < new Date(startDate).getTime()) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordTime > end.getTime()) return false;
      }
    }

    // Filter by specific date components if specified (legacy support)
    if (filterDay || filterMonth || filterYear) {
      const d = r.rawDate ? new Date(r.rawDate) : (r.date ? new Date(r.date) : null);
      if (!d || isNaN(d.getTime())) return false;
      
      if (filterYear && d.getFullYear().toString() !== filterYear) return false;
      if (filterMonth && (d.getMonth() + 1).toString() !== filterMonth) return false;
      if (filterDay && d.getDate().toString() !== filterDay) return false;
    }

    // Global search - searches across all records
    if (globalSearch && globalSearch.trim()) {
      const searchLower = globalSearch.trim().toLowerCase();
      const searchableFields = [
        r.hospNo,
        r.name,
        r.givenName,
        r.middleName,
        r.surname,
        r.exam,
        r.refNo,
        r.amount,
        r.reader,
        r.release,
        r.modality,
        r.date,
        r.title,
        r.createdBy
      ].map(f => String(f || '').toLowerCase());
      
      if (!searchableFields.some(f => f.includes(searchLower))) return false;
    }

    // Column-specific filters
    for (const key in columnFilters) {
      const selectedValues = columnFilters[key];
      if (selectedValues && selectedValues.length > 0) {
        const recordVal = String((r as any)[key] || '');
        if (!selectedValues.includes(recordVal)) return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    if (sortConfig.key === 'none') return 0;
    
    let aVal = (a as any)[sortConfig.key];
    let bVal = (b as any)[sortConfig.key];
    
    // Handle null/undefined
    if (aVal === undefined || aVal === null) aVal = '';
    if (bVal === undefined || bVal === null) bVal = '';

    // Numeric sorting for amount
    if (sortConfig.key === 'amount') {
      const aNum = parseFloat(String(aVal).replace(/[^\d.-]/g, '')) || 0;
      const bNum = parseFloat(String(bVal).replace(/[^\d.-]/g, '')) || 0;
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Date sorting for date/createdAt/deletedAt/release
    if (['date', 'createdAt', 'deletedAt', 'release'].includes(sortConfig.key as string)) {
      // Use rawDate if sorting by 'date' for better accuracy
      let aDateVal = sortConfig.key === 'date' ? (a.rawDate || a.date) : aVal;
      let bDateVal = sortConfig.key === 'date' ? (b.rawDate || b.date) : bVal;
      
      // Special handling for release string "24 MARCH 2026 @ 1:00 PM - 3:00 PM"
      if (sortConfig.key === 'release') {
        aDateVal = String(aVal).split(' @ ')[0];
        bDateVal = String(bVal).split(' @ ')[0];
      }
      
      const aTime = new Date(aDateVal).getTime() || 0;
      const bTime = new Date(bDateVal).getTime() || 0;
      if (aTime !== bTime) return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
    }

    // Default string sorting
    return sortConfig.direction === 'asc' 
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const isRecordIncomplete = (record: ClaimRecord) => {
    // Check fields based on the 13-column template in the photo
    return !record.philhealthNumber || 
           !record.name || 
           !record.hospNo || 
           !record.address || 
           !record.birthdate || 
           !record.age || 
           !record.sex || 
           !record.contactNo || 
           !record.ward || // Maps to Point of Entry
           // Allow empty for non-MAIFIPP or handle placeholder
           (!record.typeOfAssistance && record.amount !== '0.00') || 
           (!record.orNumber && !record.refNo) || 
           (!record.pfAmount && !record.amount);
  };

  const isFieldIncomplete = (record: ClaimRecord, field: keyof ClaimRecord) => {
    if (field === 'middleName' && record.noMiddleName) return false;
    if (field === 'orNumber' && record.modality !== 'X-RAY MAIN' && !record.withOR) return false;
    const val = record[field];
    return val === undefined || val === null || val === '';
  };

  const deleteWard = (wardToDelete: string) => {
    const updated = wards.filter(w => w !== wardToDelete);
    setWards(updated);
    localStorage.setItem('claim_slip_wards', JSON.stringify(updated));
    showToast('Ward removed successfully');
  };

  const deletePhysician = (physicianToDelete: string) => {
    const updated = physicians.filter(p => p !== physicianToDelete);
    setPhysicians(updated);
    localStorage.setItem('claim_slip_physicians', JSON.stringify(updated));
    showToast('Physician removed successfully');
  };

  const deleteAddress = (addressToDelete: string) => {
    const updated = addresses.filter(a => a !== addressToDelete);
    setAddresses(updated);
    localStorage.setItem('claim_slip_addresses', JSON.stringify(updated));
    showToast('Address removed successfully');
  };

  const deleteConsole = (consoleToDelete: string) => {
    const updated = consoles.filter(c => c !== consoleToDelete);
    setConsoles(updated);
    localStorage.setItem('claim_slip_consoles', JSON.stringify(updated));
    showToast('Console removed successfully');
  };

  const deleteExamRoom = (examRoomToDelete: string) => {
    const updated = examRooms.filter(e => e !== examRoomToDelete);
    setExamRooms(updated);
    localStorage.setItem('claim_slip_exam_rooms', JSON.stringify(updated));
    showToast('Exam Room removed successfully');
  };

  const deleteRecep = (recepToDelete: string) => {
    const updated = receps.filter(r => r !== recepToDelete);
    setReceps(updated);
    localStorage.setItem('claim_slip_receps', JSON.stringify(updated));
    showToast('Recep removed successfully');
  };

  const deleteRadiologist = (radiologistToDelete: string) => {
    const updated = radiologists.filter(r => r !== radiologistToDelete);
    setRadiologists(updated);
    localStorage.setItem('claim_slip_radiologists', JSON.stringify(updated));
    showToast('Radiologist removed successfully');
  };

  const deleteRadiographer = (radiographerToDelete: string) => {
    const updated = radiographers.filter(r => r !== radiographerToDelete);
    setRadiographers(updated);
    localStorage.setItem('claim_slip_radiographers', JSON.stringify(updated));
    showToast('Radiographer removed successfully');
  };

  const deleteTransferResultBy = (transferResultByToDelete: string) => {
    const updated = transferResultBys.filter(t => t !== transferResultByToDelete);
    setTransferResultBys(updated);
    localStorage.setItem('claim_slip_transfer_result_bys', JSON.stringify(updated));
    showToast('Transfer Result By removed successfully');
  };

  const incompleteRecords = records.filter(r => !r.isDeleted && isRecordIncomplete(r)).filter(r => {
    if (username !== 'ADMIN' && r.modality !== userModality) return false;
    if (completorFilters.modalities.length > 0 && !completorFilters.modalities.includes(r.modality)) return false;
    
    // Improved date comparison using rawDate
    if (completorFilters.startDate && r.rawDate && r.rawDate < completorFilters.startDate) return false;
    if (completorFilters.endDate && r.rawDate && r.rawDate > completorFilters.endDate) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateRecord = (updatedRecord: ClaimRecord, shouldClose = true) => {
    const recordWithSentBy = { ...updatedRecord, sentBy: username };
    const nextRecords = records.map(r => r.id === recordWithSentBy.id ? recordWithSentBy : r);
    setRecords(nextRecords);
    localStorage.setItem('claim_slip_records', JSON.stringify(nextRecords));
    showToast("Record updated successfully!", "success");
    if (shouldClose) {
      setShowEditModal(false);
      setEditingRecord(null);
    }
  };

  const saveAndNext = () => {
    if (!editingRecord) return;
    
    const isSplit = editingRecord.modality === 'CT SCAN MAIN' || editingRecord.modality === 'CT SCAN OPD' || editingRecord.modality === 'X-RAY MAIN';
    let fullName = editingRecord.name;
    
    if (isSplit) {
      fullName = `${editingRecord.givenName || ''} ${editingRecord.noMiddleName ? '' : (editingRecord.middleName || '')} ${editingRecord.surname || ''}`.replace(/\s+/g, ' ').trim();
    }
    
    const updated = { ...editingRecord, name: fullName || editingRecord.name };
    
    // Find next incomplete record before updating state
    const currentIndex = incompleteRecords.findIndex(r => r.id === editingRecord.id);
    let nextRecord = null;
    if (currentIndex !== -1 && currentIndex < incompleteRecords.length - 1) {
      nextRecord = incompleteRecords[currentIndex + 1];
    }
    
    updateRecord(updated, false);
    
    if (nextRecord) {
      setEditingRecord(nextRecord);
    } else {
      showToast("No more incomplete records in this view!", "info");
      setShowEditModal(false);
      setEditingRecord(null);
    }
  };

  const copyMasterlistToClipboard = () => {
    if (!startDate || !endDate) {
      setAttemptedExport(true);
      showToast('Please select both Start Date and End Date for export', 'error');
      return;
    }

    if (filteredRecords.length === 0) {
      showToast('No records to copy', 'error');
      return;
    }

    const sortedRecords = [...filteredRecords].sort((a, b) => {
      const dateA = new Date(a.rawDate || a.date).getTime() || 0;
      const dateB = new Date(b.rawDate || b.date).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });

    const countsByDate: Record<string, number> = {};
    const clipboardData = sortedRecords.map((r) => {
        const dateKey = r.date;
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
        const dailyNum = countsByDate[dateKey];
        
        return {
          "#": dailyNum,
          "Philhealth number": r.philhealthNumber || '',
          "Name of patients": formatExportName(r),
          "Hospital number": r.hospNo,
          "Address": r.address || '',
          "Date of birth": r.birthdate || '',
          "Age": r.age || '',
          "Gender": r.sex || '',
          "Contact number": r.contactNo || '',
          "Point of entry": r.ward || '',
          "Type of assistance": r.typeOfAssistance || '',
          "BILL (SOA #- PHIC CLASS/WARD) REFERENCE": r.orNumber || r.refNo || '',
          "TOTAL AMOUNT": r.pfAmount || r.amount || '',
          "Radiologist": r.reader || ''
        };
    });

    const headers = TEMPLATE_HEADERS;
    const csvContent = [
      headers.join('\t'),
      ...clipboardData.map(row => 
        headers.map(h => {
          const val = row[h as keyof typeof row];
          return val === undefined || val === null ? '' : String(val);
        }).join('\t')
      )
    ].join('\n');

    navigator.clipboard.writeText(csvContent).then(() => {
      showToast('Masterlist copied to clipboard!');
      setShowExportDropdown(false);
    });
  };

  const exportToExcel = (selectedOnly = false, recordsOverride?: ClaimRecord[]) => {
    if (!startDate || !endDate) {
      setAttemptedExport(true);
      showToast('Please select both Start Date and End Date for export', 'error');
      return;
    }

    let recordsToExport;
    if (recordsOverride) {
      recordsToExport = recordsOverride;
    } else {
      recordsToExport = selectedOnly 
        ? records.filter(r => selectedIds.has(r.id))
        : filteredRecords;
    }
    
    // Apply Radiologist filter if selected in export panel
    if (exportSelectedRadiologists.length > 0) {
      recordsToExport = recordsToExport.filter(r => exportSelectedRadiologists.includes(r.reader || ''));
    }

    const selectedModalities = recordsOverride 
      ? Array.from(new Set(recordsOverride.map(r => r.modality)))
      : (columnFilters['modality'] || []);
    
    const sortedRecords = [...recordsToExport].sort((a, b) => {
      const dateA = new Date(a.rawDate || a.date).getTime() || 0;
      const dateB = new Date(b.rawDate || b.date).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });

    const countsByDate: Record<string, number> = {};
    
    let exportData = sortedRecords.map((r) => {
        const dateKey = r.date;
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
        const dailyNum = countsByDate[dateKey];
        
        return {
          "#": dailyNum,
          "Philhealth number": r.philhealthNumber || '',
          "Name of patients": formatExportName(r),
          "Hospital number": r.hospNo,
          "Address": r.address || '',
          "Date of birth": r.birthdate || '',
          "Age": r.age || '',
          "Gender": r.sex || '',
          "Contact number": r.contactNo || '',
          "Point of entry": r.ward || '',
          "Type of assistance": r.typeOfAssistance || '',
          "BILL (SOA #- PHIC CLASS/WARD) REFERENCE": r.orNumber || r.refNo || '',
          "TOTAL AMOUNT": r.pfAmount || r.amount || '',
          "Radiologist": r.reader || ''
        };
    });
    
    if (exportData.length === 0) { 
      showToast("No records to export!", "error"); 
      return; 
    }
    
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(worksheet, exportData, { origin: "A1" });
    
    const colCount = Object.keys(exportData[0]).length;

    // Set column widths
    worksheet['!cols'] = Array(colCount).fill({ wch: 15 });
    worksheet['!cols'][0] = { wch: 8 }; 
    worksheet['!cols'][1] = { wch: 20 }; 
    worksheet['!cols'][2] = { wch: 30 }; 
    worksheet['!cols'][4] = { wch: 30 }; 
    worksheet['!cols'][11] = { wch: 35 }; 
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ClaimSlips");
    
    const fileName = `Records_${selectedModalities.length > 0 ? selectedModalities.join('_') : 'All'}${startDate ? '_from_' + startDate : ''}${endDate ? '_to_' + endDate : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setShowExportDropdown(false);
  };

  const exportToPDF = (selectedOnly = false, recordsOverride?: ClaimRecord[]) => {
    if (!startDate || !endDate) {
      setAttemptedExport(true);
      showToast('Please select both Start Date and End Date for export', 'error');
      return;
    }

    let recordsToExport;
    if (recordsOverride) {
      recordsToExport = recordsOverride;
    } else {
      recordsToExport = selectedOnly 
        ? records.filter(r => selectedIds.has(r.id))
        : filteredRecords;
    }
    
    // Apply Radiologist filter if selected in export panel
    if (exportSelectedRadiologists.length > 0) {
      recordsToExport = recordsToExport.filter(r => exportSelectedRadiologists.includes(r.reader || ''));
    }

    const selectedModalities = recordsOverride 
      ? Array.from(new Set(recordsOverride.map(r => r.modality)))
      : (columnFilters['modality'] || []);
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const sortedRecords = [...recordsToExport].sort((a, b) => {
      const dateA = new Date(a.rawDate || a.date).getTime() || 0;
      const dateB = new Date(b.rawDate || b.date).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      
      const timeA = a.time || '';
      const timeB = b.time || '';
      return timeA.localeCompare(timeB);
    });

    const countsByDate: Record<string, number> = {};

    let headers: string[] = TEMPLATE_HEADERS;
    let data: any[][] = sortedRecords.map((r) => {
        const dateKey = r.date;
        countsByDate[dateKey] = (countsByDate[dateKey] || 0) + 1;
        const dailyNum = countsByDate[dateKey];
        
        return [
          dailyNum,
          r.philhealthNumber || '',
          formatExportName(r),
          r.hospNo,
          r.address || '',
          r.birthdate || '',
          r.age || '',
          r.sex || '',
          r.contactNo || '',
          r.ward || '',
          r.typeOfAssistance || '',
          r.orNumber || r.refNo || '',
          r.pfAmount || r.amount || '',
          r.reader || ''
        ];
    });

    if (data.length === 0) {
      showToast("No records to export!", "error");
      return;
    }

    autoTable(doc, {
      head: [headers],
      body: data,
      styles: { 
        fontSize: 7, 
        cellPadding: 2, 
        halign: 'center', 
        valign: 'middle',
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [200, 200, 200]
      },
      headStyles: { 
        fillColor: [0, 120, 215], 
        textColor: 255, 
        fontSize: 7, 
        fontStyle: 'bold',
        minCellHeight: 10
      },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 20 },
        4: { cellWidth: 35 },
        5: { cellWidth: 20 },
        6: { cellWidth: 10 },
        7: { cellWidth: 12 },
        8: { cellWidth: 20 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 },
        11: { cellWidth: 40 },
        12: { cellWidth: 20 }
      },
      margin: { top: 15, left: 5, right: 5 },
      didDrawPage: (data) => {
        // Main Header
        doc.setFontSize(14);
        doc.setTextColor(0, 81, 97);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedModalities.join(' / ')} MASTERLIST LOGSHEET`, doc.internal.pageSize.width / 2, 10, { align: 'center' });
      }
    });

    const fileName = `Records_${selectedModalities.length > 0 ? selectedModalities.join('_') : 'All'}.pdf`;
    doc.save(fileName);
    setShowExportDropdown(false);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredRecords
        .filter(r => isAdminMode || !r.isDeleted)
        .map(r => r.id);
      setSelectedIds(new Set(visibleIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleRecordSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const batchAction = (action: 'delete' | 'restore' | 'purge' | 'paid' | 'unpaid') => {
    if (selectedIds.size === 0) return;
    
    let title = '';
    let msg = '';
    let variant: 'danger' | 'warning' | 'info' | 'success' = 'danger';
    let confirmText = '';

    if (action === 'delete') {
      title = 'Batch Delete';
      msg = `Move ${selectedIds.size} selected records to trash?`;
      confirmText = 'Delete Selected';
      variant = 'danger';
    } else if (action === 'restore') {
      title = 'Batch Restore';
      msg = `Restore ${selectedIds.size} selected records?`;
      confirmText = 'Restore Selected';
      variant = 'info';
    } else if (action === 'purge') {
      title = 'Batch Purge';
      msg = `CRITICAL: Permanently purge ${selectedIds.size} records? This cannot be undone!`;
      confirmText = 'Purge All Selected';
      variant = 'danger';
    } else if (action === 'paid') {
      title = 'Mark as Paid';
      msg = `Mark ${selectedIds.size} selected records as PAID?`;
      confirmText = 'Mark as Paid';
      variant = 'success';
    } else if (action === 'unpaid') {
      title = 'Mark as Unpaid';
      msg = `Mark ${selectedIds.size} selected records as UNPAID?`;
      confirmText = 'Mark as Unpaid';
      variant = 'warning';
    }

    setConfirmModal({
      show: true,
      title,
      message: msg,
      confirmText,
      cancelText: 'Cancel',
      variant,
      onConfirm: () => {
        if (action === 'delete') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { 
            ...r, 
            isDeleted: true,
            deletedBy: username,
            deletedAt: new Date().toISOString()
          } : r));
          showToast(`${selectedIds.size} records moved to trash`);
        } else if (action === 'restore') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { 
            ...r, 
            isDeleted: false, 
            isPurged: false,
            deletedBy: undefined,
            deletedAt: undefined
          } : r));
          showToast(`${selectedIds.size} records restored`);
        } else if (action === 'purge') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, isPurged: true, isDeleted: true } : r));
          showToast(`${selectedIds.size} records purged`, 'error');
        } else if (action === 'paid') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, isPaid: true } : r));
          showToast(`${selectedIds.size} records marked as Paid`, 'success');
        } else if (action === 'unpaid') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, isPaid: false } : r));
          showToast(`${selectedIds.size} records marked as Unpaid`, 'info');
        }
        setSelectedIds(new Set());
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  return (
    <div className="min-h-screen p-4 font-sans print:p-0">
      {/* Print Wrapper */}
      <div id="print-wrapper" className="hidden print:flex print:flex-col print:items-center print:fixed print:inset-0 print:bg-white print:z-[9999] print:overflow-y-auto print:pt-[0.2in] print:pb-[0.2in] gap-8">
        {printData && Array.from({ length: printSettings.copies }).map((_, i) => (
          <div 
            key={i} 
            style={getPaperSizeStyles(printSettings.paperSize)}
            className="p-[0.12in] border-2 border-black relative bg-white overflow-hidden box-border flex flex-col break-after-page"
          >
            <div className="absolute top-[4px] right-[4px] w-[38px] h-[38px]">
              <QRCodeSVG value={printData.refNo || "N/A"} size={38} />
            </div>
            <div className="font-black text-[7pt] underline mb-1 mr-[42px] text-left uppercase leading-tight decoration-1 underline-offset-2">
              {printData.title}
            </div>
            <div className="flex-grow space-y-[1px]">
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Date:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.date}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Hosp No:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.hospNo}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Name:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.name}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Exam:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.exam}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Ref No:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.refNo}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Amount:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.amount}</span>
              </div>
              <div className="flex border-b border-black pb-[1px]">
                <span className="font-bold text-[6pt] whitespace-nowrap mr-1">Reader:</span>
                <span className="font-serif text-[6.5pt] font-bold uppercase flex-grow leading-none">{printData.reader}</span>
              </div>
            </div>
            {printData.showReleaseSchedule && (
              <div className="mt-1 border-2 border-red-600 p-0.5 rounded-lg w-full box-border">
                <div className="text-red-600 font-black text-[6pt] leading-tight text-center flex flex-col">
                  <span>Release Date & Time: {printData.release.split(' @ ')[0]}</span>
                  <span>@ {printData.release.split(' @ ')[1]}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main UI */}
      <div className={`${(activeTab === 'records' || activeTab === 'completor') ? 'max-w-[98%] w-full' : 'max-w-4xl'} mx-auto bg-white rounded-3xl shadow-xl overflow-hidden print:hidden transition-all duration-500`}>
        {/* Header */}
        <div className="bg-[#095161] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Claim Slip Pro</h1>
              <p className="text-xs text-white/70">Logged in as <span className="font-bold">{username}</span></p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-4 font-bold text-xs tracking-widest transition-all border-b-2 ${
              activeTab === 'generator' 
                ? 'text-[var(--brand-pink)] border-[var(--brand-pink)] bg-white' 
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            GENERATOR
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-4 font-bold text-xs tracking-widest transition-all border-b-2 ${
              activeTab === 'records' 
                ? 'text-[var(--brand-pink)] border-[var(--brand-pink)] bg-white' 
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            RECORDS
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-4 font-bold text-xs tracking-widest transition-all border-b-2 ${
                activeTab === 'users' 
                  ? 'text-[var(--brand-pink)] border-[var(--brand-pink)] bg-white' 
                  : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/50'
              }`}
            >
              USERS
            </button>
          )}
          <button
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-4 font-bold text-xs tracking-widest transition-all border-b-2 ${
              activeTab === 'earnings' 
                ? 'text-[var(--brand-pink)] border-[var(--brand-pink)] bg-white' 
                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/50'
            }`}
          >
            DOCTOR FEES
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'generator' ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#095161]">
                  {modality} Official Reading Claim Slip
                </h2>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                  <Clock className="w-5 h-5 text-[#095161]" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      {liveClock.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-lg font-black text-[#095161] leading-none">
                      {liveClock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                      Real-time Clock
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={onPreviewClick} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isSuperAdmin ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Modality
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowModalityManager(true)}
                        className="text-[10px] font-bold text-[#095161] hover:underline flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" /> MANAGE
                      </button>
                    </div>
                    <select 
                      value={modality}
                      onChange={(e) => setModality(e.target.value)}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                    >
                      {modalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2 px-1">
                      <Clock className="w-3 h-3" /> Active Modality
                    </label>
                    <div className="w-full p-4 bg-[#095161]/5 border-2 border-[#095161]/10 rounded-xl">
                      <span className="text-xl font-black text-[#095161] tracking-tight">{modality}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (invalidFields.has('date')) {
                        const next = new Set(invalidFields);
                        next.delete('date');
                        setInvalidFields(next);
                      }
                    }}
                    className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                      invalidFields.has('date') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Hash className="w-3 h-3" /> Health Record
                    </label>
                  </div>
                  <input 
                    type="text"
                    value={hospNo}
                    onChange={(e) => {
                      setHospNo(e.target.value);
                      if (invalidFields.has('hospNo')) {
                        const next = new Set(invalidFields);
                        next.delete('hospNo');
                        setInvalidFields(next);
                      }
                    }}
                    placeholder="Enter Health Record"
                    className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                      invalidFields.has('hospNo') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                    }`}
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-given-name">
                      <UserIcon className="w-3 h-3" /> Given Name
                    </label>
                    <input 
                      id="input-given-name"
                      type="text"
                      value={givenName}
                      onChange={(e) => {
                        setGivenName(e.target.value);
                        if (invalidFields.has('givenName')) {
                          const next = new Set(invalidFields);
                          next.delete('givenName');
                          setInvalidFields(next);
                        }
                      }}
                      placeholder="Given Name"
                      className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                        invalidFields.has('givenName') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-middle-name">
                        Middle Name
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          id="checkbox-no-mn"
                          type="checkbox"
                          checked={noMiddleName}
                          onChange={(e) => {
                            setNoMiddleName(e.target.checked);
                            if (e.target.checked) setMiddleName('');
                          }}
                          className="w-3 h-3 accent-[#095161]"
                        />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">No MN</span>
                      </label>
                    </div>
                    <input 
                      id="input-middle-name"
                      type="text"
                      value={middleName}
                      disabled={noMiddleName}
                      onChange={(e) => {
                        setMiddleName(e.target.value);
                        if (invalidFields.has('middleName')) {
                          const next = new Set(invalidFields);
                          next.delete('middleName');
                          setInvalidFields(next);
                        }
                      }}
                      placeholder={noMiddleName ? "N/A" : "Middle Name"}
                      className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                        noMiddleName ? 'bg-gray-50 border-gray-100 text-gray-400' : 
                        invalidFields.has('middleName') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-surname">
                      Surname
                    </label>
                    <input 
                      id="input-surname"
                      type="text"
                      value={surname}
                      onChange={(e) => {
                        setSurname(e.target.value);
                        if (invalidFields.has('surname')) {
                          const next = new Set(invalidFields);
                          next.delete('surname');
                          setInvalidFields(next);
                        }
                      }}
                      placeholder="Surname"
                      className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                        invalidFields.has('surname') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                      }`}
                    />
                  </div>
                </div>

                {/* New Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-gender">
                       Gender
                    </label>
                    <div className="flex gap-2">
                      <button 
                        id="btn-gender-male"
                        type="button"
                        onClick={() => setSex('MALE')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${sex === 'MALE' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 border-2 border-transparent'}`}
                      >
                        MALE
                      </button>
                      <button 
                        id="btn-gender-female"
                        type="button"
                        onClick={() => setSex('FEMALE')}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${sex === 'FEMALE' ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 border-2 border-transparent'}`}
                      >
                        FEMALE
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-poe">
                      Point of Entry
                    </label>
                    <div className="flex gap-2">
                       {['SW', 'OPD', 'ER', 'IP'].map(point => (
                        <button 
                          key={point}
                          id={`btn-poe-${point.toLowerCase()}`}
                          type="button"
                          onClick={() => setPointOfEntry(point)}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all ${pointOfEntry === point ? (point === 'SW' ? 'bg-cyan-600' : point === 'OPD' ? 'bg-amber-500' : point === 'ER' ? 'bg-red-600' : 'bg-indigo-600') + ' text-white shadow-md' : 'bg-gray-100 text-gray-400 border-2 border-transparent'}`}
                        >
                          {point}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-birthday">
                      Birthday
                    </label>
                    <input 
                      id="input-birthday"
                      type="date"
                      value={birthdate}
                      onChange={(e) => handleBirthdateChange(e.target.value)}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-age">
                      Age
                    </label>
                    <input 
                      id="input-age"
                      type="text"
                      readOnly
                      value={age}
                      placeholder="Auto"
                      className="w-full p-3 border-2 border-gray-100 bg-gray-50 rounded-xl outline-none font-bold text-[#095161]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-address-selection">
                      Address Selection
                    </label>
                    <div className="relative">
                      <input 
                        id="input-address"
                        type="text"
                        list="address-list"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Select or Search Address..."
                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                      />
                      <datalist id="address-list">
                        {PSGC_ADDRESSES.map((addr, idx) => (
                          <option key={idx} value={addr} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Additional Masterlist Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-philhealth">
                      Philhealth Number
                    </label>
                    <input 
                      id="input-philhealth"
                      type="text"
                      value={philhealthNumber}
                      onChange={(e) => setPhilhealthNumber(e.target.value)}
                      placeholder="Philhealth #"
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-contact">
                      Contact Number
                    </label>
                    <input 
                      id="input-contact"
                      type="text"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder="Contact #"
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between" id="label-assistance">
                      <span>Type of Assistance</span>
                      <span className="text-[9px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded">AUTO</span>
                    </label>
                    <input 
                      id="input-assistance"
                      type="text"
                      readOnly
                      value={typeOfAssistance}
                      placeholder="Automatic"
                      className="w-full p-3 border-2 border-gray-100 bg-gray-50/50 rounded-xl outline-none transition-all font-bold text-[#095161]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-exam">
                    <FileText className="w-3 h-3" /> Examination
                  </label>
                  <input 
                    id="input-exam"
                    type="text"
                    value={exam}
                    onChange={(e) => {
                      setExam(e.target.value);
                      if (invalidFields.has('exam')) {
                        const next = new Set(invalidFields);
                        next.delete('exam');
                        setInvalidFields(next);
                      }
                    }}
                    placeholder="Type of Exam"
                    className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                      invalidFields.has('exam') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-ref-no">
                    <Hash className="w-3 h-3" /> Reference No.
                  </label>
                  <input 
                    id="input-ref-no"
                    type="text"
                    value={refNo}
                    onChange={(e) => {
                      setRefNo(e.target.value);
                      if (invalidFields.has('refNo')) {
                        const next = new Set(invalidFields);
                        next.delete('refNo');
                        setInvalidFields(next);
                      }
                    }}
                    placeholder="Ref #"
                    className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                      invalidFields.has('refNo') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2" id="label-amount">
                    <CreditCard className="w-3 h-3" /> Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                    <input 
                      id="input-amount"
                      type="text"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (invalidFields.has('amount')) {
                          const next = new Set(invalidFields);
                          next.delete('amount');
                          setInvalidFields(next);
                        }
                      }}
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                        invalidFields.has('amount') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Radiologist
                  </label>
                  <select 
                    value={reader}
                    onChange={(e) => {
                      setReader(e.target.value);
                      setIsOthersReader(e.target.value === "OTHERS");
                      if (invalidFields.has('reader')) {
                        const next = new Set(invalidFields);
                        next.delete('reader');
                        setInvalidFields(next);
                      }
                    }}
                    className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                      invalidFields.has('reader') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                    }`}
                  >
                    <option value="">-- Select --</option>
                    {RADIOLOGISTS.map(r => <option key={r} value={r}>{r.split('Dr. ')[1]}</option>)}
                    <option value="OTHERS">ADD NEW...</option>
                  </select>
                  {isOthersReader && (
                    <motion.input
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      type="text"
                      value={newReaderName}
                      onChange={(e) => {
                        setNewReaderName(e.target.value);
                        if (invalidFields.has('newReaderName')) {
                          const next = new Set(invalidFields);
                          next.delete('newReaderName');
                          setInvalidFields(next);
                        }
                      }}
                      placeholder="Enter Doctor's Name"
                      className={`w-full mt-2 p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                        invalidFields.has('newReaderName') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                      }`}
                    />
                  )}
                </div>

                <div className="md:col-span-2 space-y-4 p-6 bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Release Schedule
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowReleaseSchedule(!showReleaseSchedule)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2 ${
                        showReleaseSchedule 
                          ? 'bg-[#095161] text-white shadow-md' 
                          : 'bg-white text-gray-400 border border-gray-200'
                      }`}
                    >
                      {showReleaseSchedule ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                  
                  {showReleaseSchedule && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <input 
                        type="date"
                        value={relDate}
                        onChange={(e) => {
                          setRelDate(e.target.value);
                          if (invalidFields.has('relDate')) {
                            const next = new Set(invalidFields);
                            next.delete('relDate');
                            setInvalidFields(next);
                          }
                        }}
                        className={`w-full p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all ${
                          invalidFields.has('relDate') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                        }`}
                      />
                      <div className="space-y-2">
                        <select 
                          value={relTime}
                          onChange={(e) => {
                            setRelTime(e.target.value);
                            setIsCustomTime(e.target.value === "CUSTOM");
                          }}
                          className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                        >
                          {RELEASE_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="CUSTOM">Custom...</option>
                        </select>
                        {isCustomTime && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2"
                          >
                            <input 
                              type="time"
                              value={customTimeText}
                              onChange={(e) => {
                                setCustomTimeText(e.target.value);
                                if (invalidFields.has('customTimeText')) {
                                  const next = new Set(invalidFields);
                                  next.delete('customTimeText');
                                  setInvalidFields(next);
                                }
                              }}
                              className={`flex-1 p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all cursor-pointer ${
                                invalidFields.has('customTimeText') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                              }`}
                              title="Start Time"
                            />
                            <span className="font-bold text-gray-400">TO</span>
                            <input 
                              type="time"
                              value={customTimeEnd}
                              onChange={(e) => {
                                setCustomTimeEnd(e.target.value);
                                if (invalidFields.has('customTimeEnd')) {
                                  const next = new Set(invalidFields);
                                  next.delete('customTimeEnd');
                                  setInvalidFields(next);
                                }
                              }}
                              className={`flex-1 p-3 border-2 rounded-xl focus:border-[#095161] outline-none transition-all cursor-pointer ${
                                invalidFields.has('customTimeEnd') ? 'border-red-500 bg-red-50' : 'border-gray-100'
                              }`}
                              title="End Time"
                            />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="md:col-span-2 pt-4 space-y-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-[#095161] to-[#0b6377] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    CONFIRM & PRINT
                  </button>
                  <button 
                    type="button"
                    onClick={clearForm}
                    className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                  >
                    CLEAR FORM
                  </button>
                </div>
              </form>
            </motion.div>
          ) : activeTab === 'earnings' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#095161]">Doctor Earnings Report</h2>
                  <p className="text-sm text-gray-500 font-medium">View and export reading fees earned by radiologists</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={earningsStartDate}
                      onChange={(e) => setEarningsStartDate(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none text-gray-700"
                    />
                    <span className="text-gray-300">to</span>
                    <input 
                      type="date" 
                      value={earningsEndDate}
                      onChange={(e) => setEarningsEndDate(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none text-gray-700"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={exportEarningsToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      EXCEL
                    </button>
                    <button 
                      onClick={exportEarningsToPDF}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-[#095161] to-[#0b6377] p-5 rounded-[1.5rem] text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-3 opacity-80">
                    <UserIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active Doctors</span>
                  </div>
                  <div className="text-2xl font-black mb-1">{getDoctorEarnings().length}</div>
                  <div className="text-[9px] opacity-70 font-medium uppercase tracking-wider">With earnings in this period</div>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border-2 border-gray-50 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 text-gray-400">
                    <Layers className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Total Records</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 mb-1">
                    {getDoctorEarnings().reduce((acc, d) => acc + d.totalRecords, 0)}
                  </div>
                  <div className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Total processed slips</div>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border-2 border-cyan-50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-50 rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                  <div className="flex items-center gap-3 mb-3 text-cyan-600 relative z-10">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">MAIFIPP Reported</span>
                  </div>
                  <div className="text-2xl font-black text-cyan-600 mb-1 relative z-10">
                    ₱ {getDoctorEarnings().reduce((acc, d) => acc + d.totalMaifippAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-cyan-400 font-black uppercase tracking-wider relative z-10">Total reported earnings</div>
                </div>
                <div className="bg-white p-5 rounded-[1.5rem] border-2 border-emerald-50 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
                  <div className="flex items-center gap-3 mb-3 text-emerald-600 relative z-10">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Total Earnings</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 mb-1 relative z-10">
                    ₱ {getDoctorEarnings().reduce((acc, d) => acc + d.totalAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] text-emerald-400 font-black uppercase tracking-wider relative z-10">Total reading fees</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Doctor / Radiologist</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Records</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modality Breakdown</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">PAID TO CASHIER</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Reported to MAIFIPP</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getDoctorEarnings().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-gray-400">
                          <div className="flex flex-col items-center gap-3">
                            <Search className="w-12 h-12 opacity-20" />
                            <p className="font-bold">No earnings found for the selected date range.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      getDoctorEarnings().map((d) => (
                        <tr 
                          key={d.doctor} 
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedDoctorForMaifipp(d.doctor);
                            if (!isAdminMode) {
                              setMaifippModalTab('reported');
                            } else {
                              setMaifippModalTab('pending');
                            }
                            setShowMaifippModal(true);
                          }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#095161]/10 rounded-full flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                <UserIcon className="w-5 h-5 text-[#095161]" />
                                <div className="absolute -top-1 -right-1 bg-cyan-600 text-white rounded-full p-0.5 shadow-sm">
                                  <Settings className="w-2.5 h-2.5" />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-800">{d.doctor}</span>
                                <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">
                                  {isAdminMode ? 'Click to manage MAIFIPP' : 'Click to view MAIFIPP History'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                              {d.totalRecords}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(d.modalityBreakdown).map(([mod, stats]) => (
                                <div key={mod} className="flex flex-col bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                  <span className="text-[9px] font-black text-[#095161] uppercase tracking-tighter">{mod}</span>
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {stats.count} slips • ₱ {stats.amount.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-black ${d.totalPaidToCashierAmount > 0 ? 'text-emerald-600' : 'text-gray-300 italic'}`}>
                                ₱ {d.totalPaidToCashierAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {d.totalPaidToCashierAmount > 0 && (
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Paid</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-black ${d.totalMaifippAmount > 0 ? 'text-cyan-600' : 'text-gray-300 italic'}`}>
                                ₱ {d.totalMaifippAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              {d.totalMaifippAmount > 0 && (
                                <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mt-1">Reported</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className="text-lg font-black text-emerald-600">
                              ₱ {d.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : activeTab === 'users' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h2 className="text-2xl font-bold text-[#095161]">System Management</h2>
                <div className="flex items-center gap-3">
                  <div className="bg-[#095161]/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#095161]" />
                    <span className="text-sm font-bold text-[#095161]">Admin Access Only</span>
                  </div>
                </div>
              </div>

              {/* Modality Management Section */}
              <div className="bg-white p-8 rounded-[2rem] border border-cyan-50 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Settings className="w-6 h-6 text-[#095161]" />
                    <h3 className="text-xl font-bold text-gray-800">Registration Modalities</h3>
                  </div>
                  <button
                    onClick={() => {
                      setModalityInput('');
                      setShowAddModalityModal(true);
                    }}
                    className="px-4 py-2 bg-[#095161] text-white text-xs font-bold rounded-xl hover:bg-[#0b6377] transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> ADD MODALITY
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {modalities.map((m: string) => (
                    <div key={m} className="group relative">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-100 hover:bg-slate-100 transition-all uppercase tracking-wider">
                        {m}
                        {username === 'ADMIN' && (
                          <button
                            onClick={() => {
                              setConfirmModal({
                                show: true,
                                title: 'Remove Modality',
                                message: `Are you sure you want to remove ${m} from the modality list? This will only affect new registrations.`,
                                confirmText: 'Confirm',
                                cancelText: 'Cancel',
                                variant: 'danger',
                                onConfirm: () => {
                                  const updated = modalities.filter((x: string) => x !== m);
                                  setModalities(updated);
                                  localStorage.setItem('claim_slip_modalities', JSON.stringify(updated));

                                  // Audit Log
                                  const newLog = {
                                    timestamp: new Date().toISOString(),
                                    user: username,
                                    action: 'SYSTEM_CONFIG',
                                    details: `Removed modality: ${m}`
                                  };
                                  const updatedLogs = [newLog, ...systemLogs].slice(0, 100);
                                  setSystemLogs(updatedLogs);
                                  localStorage.setItem('claim_slip_logs', JSON.stringify(updatedLogs));
                                  setConfirmModal(prev => ({ ...prev, show: false }));
                                  showToast(`Modality ${m} removed`);
                                }
                              });
                            }}
                            className="text-rose-400 hover:text-rose-600 ml-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-4 font-medium italic">Note: Adding or removing a modality here updates the registration choices for new users.</p>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4 px-1">User Management & Activity</h3>
              <div className="grid gap-4">
                {users.map((user: any) => {
                  const lastActive = user.lastActive ? new Date(user.lastActive) : null;
                  const isOnline = lastActive && (new Date().getTime() - lastActive.getTime() < 300000); // 5 mins
                  
                  return (
                    <div key={user.username} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-[#095161]/10 rounded-full flex items-center justify-center">
                            <UserIcon className="w-6 h-6 text-[#095161]" />
                          </div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full pulse-animation" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">{user.username}</h3>
                            {isOnline ? (
                              <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100 animate-pulse">Online</span>
                            ) : (
                              <span className="text-[8px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-gray-200">Offline</span>
                            )}
                            {user.modality && (
                              <span className="text-[9px] font-black text-[#095161] bg-[#095161]/5 px-2 py-0.5 rounded-md uppercase border border-[#095161]/10">
                                {user.modality}
                              </span>
                            )}
                            {user.username !== 'ADMIN' && (
                              <div className="flex items-center gap-1">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${user.isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {user.isApproved ? 'Approved' : 'Pending'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-gray-500 font-medium">{user.email || 'No email'}</p>
                            {lastActive && (
                              <div className="flex items-center gap-1 text-[9px] text-gray-400 border-l pl-3 ml-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Active: {lastActive.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {user.username !== 'ADMIN' && (
                          <button
                            onClick={() => {
                              setSelectedUserForHistory(user);
                              const today = new Date().toISOString().split('T')[0];
                              setHistoryStartDate(today);
                              setHistoryEndDate(today);
                              setShowHistoryModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-[#095161] hover:bg-slate-100 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold"
                            title="View History"
                          >
                            <Clock className="w-4 h-4" /> HISTORY
                          </button>
                        )}

                        {user.username !== 'ADMIN' && !user.isApproved && (
                          <button
                            onClick={() => approveUser(user.username)}
                            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            APPROVE
                          </button>
                        )}
                        
                        {user.username !== 'ADMIN' ? (
                          <button
                            onClick={() => {
                              setConfirmModal({
                                show: true,
                                title: 'Remove User',
                                message: `Are you sure you want to remove user "${user.username}"? This will delete their account permanently.`,
                                confirmText: 'Confirm',
                                cancelText: 'Cancel',
                                variant: 'danger',
                                onConfirm: () => {
                                  deleteUser(user.username);
                                  setConfirmModal(prev => ({ ...prev, show: false }));
                                }
                              });
                            }}
                            className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove User"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-[#095161] bg-[#095161]/10 px-4 py-2 rounded-xl border border-[#095161]/20 uppercase tracking-[0.2em]">Master Console</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {users.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No registered users found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Header Section - Based on Image */}
              <div className="bg-white rounded-t-3xl border-b border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-700">Transaction Records List</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Centralized Claim Slip Management</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative group min-w-[280px]">
                      <input 
                        type="text"
                        value={searchInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchInput(val);
                          setGlobalSearch(val);
                          setCurrentPage(1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setGlobalSearch(searchInput);
                            setCurrentPage(1);
                          }
                        }}
                        placeholder="Search by Keywords..."
                        className="w-full pl-4 pr-10 py-2 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] outline-none transition-all text-xs text-gray-600"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {searchInput && (
                          <button onClick={() => { setSearchInput(''); setGlobalSearch(''); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setGlobalSearch(searchInput);
                            setCurrentPage(1);
                          }}
                          className="text-gray-400 hover:text-[var(--brand-blue)] transition-colors"
                          title="Search"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Results Per Page */}
                    <select 
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-300 rounded-md px-2 py-2 text-[10px] font-bold text-gray-600 outline-none cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <option value={5}>05</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setIsFilterPanelOpen(!isFilterPanelOpen);
                          setIsExportPanelOpen(false);
                        }}
                      className={`px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95 border ${
                        isFilterPanelOpen 
                          ? 'bg-[var(--brand-blue)] text-white border-[var(--brand-blue)]' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {isFilterPanelOpen ? 'Hide Filters' : 'Filters'}
                    </button>

                    <button 
                      onClick={() => {
                        setIsExportPanelOpen(!isExportPanelOpen);
                        setIsFilterPanelOpen(false);
                      }}
                      className={`px-4 py-2 rounded-md font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95 border ${
                        isExportPanelOpen 
                          ? 'bg-[#095161] text-white border-[#095161]' 
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isExportPanelOpen ? 'Hide Export' : 'Export Masterlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
              <AnimatePresence>
                {isExportPanelOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white border-b border-gray-200 p-6 shadow-sm"
                  >
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-6">
                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Export Start Date</label>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (e.target.value && endDate) setAttemptedExport(false);
                          }}
                          className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all ${
                            attemptedExport && !startDate ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#095161]/20'
                          }`}
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Export End Date</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            if (e.target.value && startDate) setAttemptedExport(false);
                          }}
                          className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all ${
                            attemptedExport && !endDate ? 'border-red-500 bg-red-50 ring-2 ring-red-100' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#095161]/20'
                          }`}
                        />
                      </div>

                      {/* Radiologist Selection for Export */}
                      <div className="space-y-2 flex-1 min-w-[220px]">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter by Radiologist</label>
                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsExportRadiologistDropdownOpen(!isExportRadiologistDropdownOpen); }}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all"
                          >
                            <span className="truncate">
                              {exportSelectedRadiologists.length === 0 
                                ? 'All Radiologists' 
                                : `${exportSelectedRadiologists.length} Selected`}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExportRadiologistDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isExportRadiologistDropdownOpen && (
                              <>
                                <div className="fixed inset-0 z-[100]" onClick={() => setIsExportRadiologistDropdownOpen(false)} />
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-[101] overflow-hidden"
                                >
                                  <div className="p-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setExportSelectedRadiologists(getAvailableRadiologistsForExport()); }}
                                      className="text-[9px] font-bold text-[#095161] uppercase tracking-wider hover:underline px-2 py-1"
                                    >
                                      Select All
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setExportSelectedRadiologists([]); }}
                                      className="text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline px-2 py-1"
                                    >
                                      Clear Selection
                                    </button>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                    {getAvailableRadiologistsForExport().length === 0 ? (
                                      <div className="p-4 text-center text-gray-400 text-[10px] italic">No radiologists found for this period</div>
                                    ) : (
                                      getAvailableRadiologistsForExport().map(rad => {
                                        const isSelected = exportSelectedRadiologists.includes(rad);
                                        return (
                                          <label 
                                            key={rad} 
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                              isSelected ? 'bg-[#095161] border-[#095161]' : 'border-gray-300 group-hover:border-[#095161]'
                                            }`}>
                                              {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <input 
                                              type="checkbox"
                                              className="hidden"
                                              checked={isSelected}
                                              onChange={() => {
                                                const next = isSelected 
                                                  ? exportSelectedRadiologists.filter(v => v !== rad)
                                                  : [...exportSelectedRadiologists, rad];
                                                setExportSelectedRadiologists(next);
                                              }}
                                            />
                                            <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{rad}</span>
                                          </label>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => exportToExcel(false)}
                          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-700 transition-all active:scale-95 group"
                        >
                          <Database className="w-4 h-4" />
                          <span className="font-black text-xs uppercase tracking-wider">Excel</span>
                        </button>
                        <button 
                          onClick={() => exportToPDF(false)}
                          className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl shadow-lg hover:bg-rose-700 transition-all active:scale-95 group"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="font-black text-xs uppercase tracking-wider">PDF</span>
                        </button>
                        <button 
                          onClick={copyMasterlistToClipboard}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl shadow-lg hover:bg-gray-900 transition-all active:scale-95 group"
                        >
                          <Copy className="w-4 h-4" />
                          <span className="font-black text-xs uppercase tracking-wider">Copy</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter Section */}
              <AnimatePresence>
                {isFilterPanelOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white border-b border-gray-200 p-6 shadow-sm"
                  >
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {/* Modality Filter Dropdown */}
                    {isSuperAdmin && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modality Filter</label>
                        <div className="relative">
                          <button 
                            onClick={() => setIsModalityDropdownOpen(!isModalityDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-all"
                          >
                            <span className="truncate">
                              {(columnFilters['modality'] || []).length === 0 
                                ? 'All Modalities' 
                                : `${(columnFilters['modality'] || []).length} Selected`}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isModalityDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isModalityDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setIsModalityDropdownOpen(false)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                  className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden"
                                >
                                  <div className="p-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <button 
                                      onClick={() => setColumnFilters({ ...columnFilters, modality: [...modalities] })}
                                      className="text-[9px] font-bold text-[var(--brand-blue)] uppercase tracking-wider hover:underline px-2 py-1"
                                    >
                                      Select All
                                    </button>
                                    <button 
                                      onClick={() => setColumnFilters({ ...columnFilters, modality: [] })}
                                      className="text-[9px] font-bold text-red-500 uppercase tracking-wider hover:underline px-2 py-1"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                    {modalities.map(m => {
                                      const isSelected = (columnFilters['modality'] || []).includes(m);
                                      return (
                                        <label 
                                          key={m} 
                                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                                        >
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                            isSelected ? 'bg-[var(--brand-blue)] border-[var(--brand-blue)]' : 'border-gray-300 group-hover:border-[var(--brand-blue)]'
                                          }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                          </div>
                                          <input 
                                            type="checkbox"
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => {
                                              const current = columnFilters['modality'] || [];
                                              const next = current.includes(m) 
                                                ? current.filter(v => v !== m)
                                                : [...current, m];
                                              setColumnFilters({ ...columnFilters, modality: next });
                                            }}
                                          />
                                          <span className={`text-xs font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{m}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                      {/* Date Filters */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                        <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-[var(--brand-blue)] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                        <input 
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:ring-1 focus:ring-[var(--brand-blue)] transition-all"
                        />
                      </div>

                      {/* Toggles */}
                      <div className="flex flex-col justify-end gap-3">
                        <button 
                          onClick={() => setShowOnlyPaid(!showOnlyPaid)}
                          className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                            showOnlyPaid 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Paid List Only
                        </button>
                      </div>

                      {/* Reset */}
                      <div className="flex items-end">
                        <button 
                          onClick={() => {
                            setColumnFilters({});
                            setStartDate('');
                            setEndDate('');
                            setGlobalSearch('');
                            setSearchInput('');
                            setShowOnlyPaid(false);
                            setShowColumnFilters(false);
                          }}
                          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#095161]/5 border-2 border-[#095161] p-4 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#095161]">{selectedIds.size} Selected</span>
                      <div className="h-6 w-px bg-[#095161]/20" />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => batchAction('paid')}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                        >
                          <CheckSquare className="w-4 h-4" /> Mark as Paid
                        </button>
                        <button 
                          onClick={() => batchAction('unpaid')}
                          className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-all shadow-sm active:scale-95"
                        >
                          <Square className="w-4 h-4" /> Mark as Unpaid
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const allIds = filteredRecords.map(r => r.id);
                          setSelectedIds(new Set(allIds));
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                      >
                        <CheckSquare className="w-4 h-4" /> Select All
                      </button>
                      <button 
                        onClick={() => setSelectedIds(new Set())}
                        className="bg-white border-2 border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                      >
                        <X className="w-4 h-4" /> Clear Selection
                      </button>
                      {(!isAdminMode || username === 'ADMIN') && (
                        <button 
                          onClick={() => batchAction('delete')}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-600 transition-all shadow-sm active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      )}
                      {isAdminMode && (
                        <>
                          <button 
                            onClick={() => batchAction('restore')}
                            className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-cyan-700 transition-all shadow-sm active:scale-95"
                          >
                            <RotateCcw className="w-4 h-4" /> Restore
                          </button>
                          <button 
                            onClick={() => batchAction('purge')}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-900 transition-all shadow-sm active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" /> Purge
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto rounded-[2rem] border-2 border-white shadow-2xl shadow-[#095161]/5 bg-white/40 backdrop-blur-sm">
                <table className="w-full text-left text-xs border-collapse table-fixed min-w-[1400px]">
                  <thead className="bg-[#095161] text-white sticky top-0 z-10">
                    <tr>
                      {[
                        { label: 'Date', key: 'date', width: '130px' },
                        { label: 'Modality', key: 'modality', width: '120px' },
                        { label: 'Philhealth No', key: 'philhealthNumber', width: '130px' },
                        { label: 'Patient Name', key: 'name', width: '220px' },
                        { label: 'Hosp No', key: 'hospNo', width: '90px' },
                        { label: 'Address', key: 'address', width: '200px' },
                        { label: 'DOB', key: 'birthdate', width: '100px' },
                        { label: 'Age', key: 'age', width: '50px' },
                        { label: 'Gender', key: 'sex', width: '60px' },
                        { label: 'Contact No', key: 'contactNo', width: '110px' },
                        { label: 'Entry', key: 'ward', width: '100px' },
                        { label: 'Assistance', key: 'typeOfAssistance', width: '120px' },
                        { label: 'Reference', key: 'refNo', width: '120px' },
                        { label: 'Amount', key: 'amount', width: '100px' },
                        { label: 'Radiologist', key: 'reader', width: '200px' },
                        ...(isAdminMode && username === 'ADMIN' ? [
                          { label: 'Created By', key: 'createdBy', width: '100px' },
                          { label: 'Created At', key: 'createdAt', width: '140px' },
                          { label: 'Deleted By', key: 'deletedBy', width: '100px' },
                          { label: 'Deleted At', key: 'deletedAt', width: '140px' }
                        ] : [])
                      ].map(col => (
                        <th key={col.key} style={{ width: col.width }} className="px-6 py-5 relative border-b border-[#084a59] h-16">
                          <div className="flex items-center gap-2 h-full">
                            <button 
                              onClick={() => {
                                setSortConfig({
                                  key: col.key as keyof ClaimRecord,
                                  direction: sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                                });
                              }}
                              className="flex items-center gap-1 hover:text-cyan-200 transition-all uppercase tracking-widest font-black text-[10px] group whitespace-nowrap"
                            >
                              {col.label}
                              <div className="flex flex-col -space-y-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                <ChevronDown className={`w-3 h-3 rotate-180 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-cyan-300 opacity-100' : ''}`} />
                                <ChevronDown className={`w-3 h-3 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-cyan-300 opacity-100' : ''}`} />
                              </div>
                            </button>
                            
                            {showColumnFilters && (
                              <button 
                                onClick={() => toggleFilter(col.key)}
                                className={`p-1.5 rounded-lg hover:bg-white/20 transition-all ${columnFilters[col.key]?.length > 0 ? 'bg-cyan-400/20 text-cyan-300' : 'text-white/40'}`}
                              >
                                <Filter className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {openFilterKey === col.key && (
                              <>
                                <div className="fixed inset-0 z-[100]" onClick={() => setOpenFilterKey(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-2xl shadow-2xl z-[101] min-w-[240px] p-4 border border-gray-100"
                                >
                                  <div className="space-y-4">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                      <input 
                                        type="text"
                                        placeholder="Search values..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#095161] text-sm"
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-bold text-[#095161] px-1">
                                      <button onClick={() => selectAllFilter(col.key)} className="hover:underline">SELECT ALL</button>
                                      <button onClick={() => clearFilter(col.key)} className="hover:underline">CLEAR</button>
                                    </div>

                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                      {getUniqueValues(col.key).map((val: string) => (
                                        <label key={val} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                          <input 
                                            type="checkbox"
                                            checked={(tempColumnFilters[col.key] || []).includes(val)}
                                            onChange={() => toggleTempFilterValue(col.key, val)}
                                            className="w-4 h-4 accent-[#095161] rounded"
                                          />
                                          <span className="text-xs font-medium truncate">{val || '(Blanks)'}</span>
                                        </label>
                                      ))}
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                      <button 
                                        onClick={() => setOpenFilterKey(null)}
                                        className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                                      >
                                        CANCEL
                                      </button>
                                      <button 
                                        onClick={() => applyFilter(col.key)}
                                        className="flex-1 py-2 text-xs font-bold bg-[#095161] text-white rounded-lg hover:bg-[#0b6377] transition-colors shadow-md"
                                      >
                                        OK
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </th>
                      ))}
                      <th className="p-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/50">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={isAdminMode && username === 'ADMIN' ? 15 : 11} className="p-32 text-center">
                          <div className="flex flex-col items-center gap-6 text-gray-300">
                            <div className="p-8 bg-gray-50 rounded-[3rem] shadow-inner">
                              <FileText className="w-20 h-20 opacity-20" />
                            </div>
                            <div className="space-y-2">
                              <p className="font-black text-gray-500 text-2xl tracking-tight">No records found</p>
                              <p className="text-sm font-medium text-gray-400">Try adjusting your filters or search terms.</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map((record) => {
                        if (record.isDeleted && !isAdminMode) return null;
                        const isIncomplete = isRecordIncomplete(record);
                        return (
                          <tr 
                            key={record.id} 
                            onClick={() => toggleRecordSelection(record.id)}
                            onMouseEnter={() => setHoveredRow(record.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            className={`group transition-all duration-200 cursor-pointer relative border-b border-gray-100/50 ${
                              record.isPurged ? 'bg-gray-50 text-gray-400 italic' : 
                              record.isDeleted ? 'bg-red-50/50 text-red-400 line-through' : 
                              isIncomplete ? 'bg-red-50 hover:bg-red-100 border-l-4 border-red-500' :
                              record.isPaid ? 'bg-emerald-50/10 hover:bg-emerald-50/20' : 'hover:bg-cyan-50/10'
                            } ${selectedIds.has(record.id) ? 'bg-emerald-50/80 shadow-[0_0_0_2px_#215B63_inset] z-10 ring-1 ring-[#215B63]' : ''}`}
                          >
                             <td style={{ width: '130px' }} className="px-6 py-5 whitespace-nowrap font-bold text-gray-500 text-[11px] relative">
                               {/* Improved Incomplete Data Tooltip */}
                               {isIncomplete && !record.isDeleted && !record.isPurged && (
                                 <div className="absolute left-1/2 -top-10 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 z-[100] scale-90 group-hover:scale-100">
                                   <div className="bg-red-600 text-white text-[10px] font-black py-1.5 px-4 rounded-full shadow-2xl whitespace-nowrap flex items-center gap-2">
                                     <AlertCircle className="w-3.5 h-3.5" />
                                     INCOMPLETE DATA
                                   </div>
                                   <div className="w-2.5 h-2.5 bg-red-600 rotate-45 mx-auto -mt-1 shadow-2xl"></div>
                                 </div>
                               )}
                               {record.date}
                             </td>
                            <td style={{ width: '120px' }} className="px-6 py-5">
                              <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded-lg font-black text-[10px] uppercase tracking-wider">
                                {record.modality}
                              </span>
                            </td>
                            <td style={{ width: '130px' }} className="px-6 py-5 font-mono text-gray-600 font-bold">{record.philhealthNumber || '-'}</td>
                            <td style={{ width: '220px' }} className="px-6 py-5">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-gray-900 text-sm tracking-tight leading-tight">{record.name}</span>
                                  {isIncomplete && !record.isDeleted && !record.isPurged && (
                                    <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                                  )}
                                </div>
                                {record.isPaid && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                                    <CheckCircle className="w-3 h-3" /> Paid
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ width: '90px' }} className="px-6 py-5 font-mono font-bold text-gray-400 tracking-tighter">{record.hospNo}</td>
                            <td style={{ width: '200px' }} className="px-6 py-5 text-gray-600 font-medium whitespace-nowrap overflow-hidden truncate">{record.address || '-'}</td>
                            <td style={{ width: '100px' }} className="px-6 py-5 text-gray-500 font-medium whitespace-nowrap">{record.birthdate || '-'}</td>
                            <td style={{ width: '50px' }} className="px-6 py-5 text-gray-600 font-bold">{record.age || '-'}</td>
                            <td style={{ width: '60px' }} className="px-6 py-5 text-gray-600 font-bold">{record.sex || '-'}</td>
                            <td style={{ width: '110px' }} className="px-6 py-5 text-gray-500 font-medium whitespace-nowrap">{record.contactNo || '-'}</td>
                            <td style={{ width: '100px' }} className="px-6 py-5 text-gray-600 font-bold uppercase">{record.ward || '-'}</td>
                            <td style={{ width: '120px' }} className="px-6 py-5 text-gray-600 font-medium italic">{record.typeOfAssistance || '-'}</td>
                            <td style={{ width: '120px' }} className="px-6 py-5 font-mono text-gray-400 font-bold">{record.withOR ? record.orNumber : record.refNo || '-'}</td>
                            <td style={{ width: '100px' }} className="px-6 py-5">
                              <span className="inline-block px-3 py-1.5 bg-[#095161]/5 text-[#095161] rounded-xl font-black text-sm shadow-sm border border-[#095161]/10">
                                {record.amount}
                              </span>
                            </td>
                            <td style={{ width: '200px' }} className="px-6 py-5 font-bold text-gray-700 whitespace-nowrap overflow-hidden truncate">
                              {record.reader || '-'}
                            </td>
                            {isAdminMode && username === 'ADMIN' && (
                              <>
                                <td style={{ width: '100px' }} className="px-6 py-5 text-[10px] font-mono text-gray-400">{record.createdBy}</td>
                                <td style={{ width: '140px' }} className="px-6 py-5 text-[10px] font-mono text-gray-400">
                                  {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
                                </td>
                                <td style={{ width: '100px' }} className="px-6 py-5 text-[10px] font-mono text-red-400 font-bold">
                                  {record.isDeleted ? record.deletedBy || '-' : '-'}
                                </td>
                                <td style={{ width: '140px' }} className="px-6 py-5 text-[10px] font-mono text-red-400">
                                  {record.isDeleted && record.deletedAt ? new Date(record.deletedAt).toLocaleString() : '-'}
                                </td>
                              </>
                            )}
                            <td className="p-4 relative" onClick={(e) => e.stopPropagation()}>
                              <AnimatePresence>
                                {(selectedIds.has(record.id) || hoveredRow === record.id) && (
                                  <motion.div 
                                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 p-2 bg-white border border-blue-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] z-20 backdrop-blur-md"
                                  >
                                    {record.isPurged ? (
                                      <button 
                                        onClick={() => restoreRecord(record.id)}
                                        className="p-2.5 bg-[#095161] text-white rounded-xl hover:bg-[#0b6377] transition-all shadow-md active:scale-95"
                                        title="Restore Purged Record"
                                      >
                                        <RotateCcw className="w-4 h-4" />
                                      </button>
                                    ) : !record.isDeleted ? (
                                      <>
                                        <button 
                                          onClick={() => {
                                            setEditingRecord({
                                              ...record,
                                              withOR: record.withOR !== undefined ? record.withOR : !!record.orNumber
                                            });
                                            setShowEditModal(true);
                                          }}
                                          className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase"
                                          title="Edit Record"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                        <button 
                                          onClick={() => handlePrintTicket(record)}
                                          className="flex items-center gap-2 px-3 py-2.5 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase"
                                          title="Print Ticket"
                                        >
                                          <Printer className="w-3.5 h-3.5" /> Print
                                        </button>
                                        <button 
                                          onClick={() => deleteRecord(record.id)}
                                          className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                          title="Delete Record"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <button 
                                        onClick={() => restoreRecord(record.id)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-sm font-bold text-[10px] uppercase"
                                        title="Restore Record"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                                      </button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
              <div className="bg-white p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Showing <span className="text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-700">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="text-gray-700">{filteredRecords.length}</span> Records
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 2 + i;
                        if (pageNum + (4 - i) > totalPages) pageNum = totalPages - (4 - i);
                        if (pageNum < 1) pageNum = i + 1;
                      }
                      
                      return (
                        <button 
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all ${
                            currentPage === pageNum 
                              ? 'bg-[var(--brand-blue)] text-white shadow-md' 
                              : 'text-gray-500 hover:bg-gray-50 border border-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-2 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setIsAdminMode(!isAdminMode)}
                    className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${isAdminMode ? (username === 'ADMIN' ? 'bg-[#095161]' : 'bg-red-500') : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAdminMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <label className="text-sm font-bold text-gray-600 flex items-center gap-2 cursor-pointer" onClick={() => setIsAdminMode(!isAdminMode)}>
                    {username === 'ADMIN' ? (
                      <>
                        <Shield className="w-4 h-4" />
                        ADMIN MODE (Show/Restore/Purge Deleted)
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        SHOW DELETED RECORDS (Restore or Permanently Delete)
                      </>
                    )}
                  </label>
                </div>

                {username === 'ADMIN' && isAdminMode && (
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => setShowPurged(!showPurged)}
                      className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${showPurged ? 'bg-black' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showPurged ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                    <label className="text-sm font-bold text-gray-600 flex items-center gap-2 cursor-pointer" onClick={() => setShowPurged(!showPurged)}>
                      <Clock className="w-4 h-4" />
                      VIEW PURGED HISTORY (See records even after permanent deletion)
                    </label>
                  </div>
                )}
              </div>
          </div>
        </motion.div>
    )}
  </div>
</div>

      {/* Modality Manager Modal */}
      <AnimatePresence>
        {showModalityManager && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]"
            >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#095161]/10 p-2 rounded-xl">
                      <Settings className="w-6 h-6 text-[#095161]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Manage Modalities</h3>
                  </div>
                  <button onClick={() => setShowModalityManager(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="flex gap-2 mb-6">
                  <input 
                    type="text"
                    autoFocus
                    value={newModalityInput}
                    onChange={(e) => setNewModalityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addModality()}
                    placeholder="New Modality Name (e.g. ULTRASOUND)"
                    className="flex-grow p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                  <button 
                    onClick={addModality}
                    className="bg-[#095161] text-white p-3 rounded-xl hover:bg-[#0b6377] transition-all shadow-md active:scale-95"
                    title="Add Modality"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

              <div className="flex-grow overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {modalities.map((m, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl group">
                    {editingModalityIndex === index ? (
                      <>
                        <input 
                          type="text"
                          value={editingModalityValue}
                          onChange={(e) => setEditingModalityValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveModalityEdit()}
                          className="flex-grow p-1 border-b-2 border-[#095161] bg-transparent outline-none font-bold"
                          autoFocus
                        />
                        <button onClick={saveModalityEdit} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingModalityIndex(null)} className="text-gray-400 p-1 hover:bg-gray-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-grow font-bold text-gray-700">{m}</span>
                        <button 
                          onClick={() => startEditingModality(index)}
                          className="text-cyan-600 p-2 hover:bg-cyan-50 rounded-xl transition-all"
                          title="Edit Modality"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteModality(index)}
                          className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Modality"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowModalityManager(false)}
                  className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
                >
                  DONE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[30000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'info' ? 'bg-cyan-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : toast.type === 'info' ? <Info className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[22000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl overflow-hidden relative"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${
                confirmModal.variant === 'danger' ? 'bg-red-500' : 
                confirmModal.variant === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
              }`} />
              
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-2xl ${
                  confirmModal.variant === 'danger' ? 'bg-red-50 text-red-500' : 
                  confirmModal.variant === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-cyan-50 text-cyan-500'
                }`}>
                  {confirmModal.variant === 'danger' ? <Trash2 className="w-6 h-6" /> : 
                   confirmModal.variant === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{confirmModal.title}</h3>
                  <p className="text-gray-500 text-sm mt-1">{confirmModal.message}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  {confirmModal.cancelText}
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition-all ${
                    confirmModal.variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 
                    confirmModal.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[30px] p-10 max-w-md w-full text-center shadow-2xl border-t-8 border-red-500"
            >
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-red-500 mb-2">Missing Information</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Please ensure all fields are filled out before generating the claim slip.
              </p>
              <button 
                onClick={() => setShowWarning(false)}
                className="bg-gray-900 text-white px-10 py-3 rounded-full font-bold hover:bg-black transition-all shadow-lg"
              >
                UNDERSTOOD
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingRecord && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRecord(null);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-[#095161]/10 rounded-3xl">
                  <Edit2 className="w-8 h-8 text-[#095161]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#095161] tracking-tight">Complete Record Data</h3>
                  <p className="text-gray-500 font-medium">Modality: {editingRecord.modality}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-2 custom-scrollbar overflow-visible">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date</label>
                  <input 
                    type="date"
                    value={editingRecord.rawDate || editingRecord.date || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditingRecord({ 
                        ...editingRecord, 
                        rawDate: newDate, 
                        date: formatDate(newDate) 
                      });
                    }}
                    onKeyDown={(e) => handleBackspaceClear(e, 'date')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'date') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Philhealth No</label>
                  <input 
                    type="text"
                    value={editingRecord.philhealthNumber || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, philhealthNumber: e.target.value })}
                    onKeyDown={(e) => handleBackspaceClear(e, 'philhealthNumber')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'philhealthNumber') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                {(isSplitNameModality(editingRecord.modality)) ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Given Name</label>
                      <input 
                        type="text"
                        value={editingRecord.givenName || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, givenName: e.target.value })}
                        onKeyDown={(e) => handleBackspaceClear(e, 'givenName')}
                        className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'givenName') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Middle Name</label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={editingRecord.noMiddleName || false}
                            onChange={(e) => setEditingRecord({ ...editingRecord, noMiddleName: e.target.checked, middleName: e.target.checked ? '' : editingRecord.middleName })}
                            className="w-3 h-3 accent-[#095161]"
                          />
                          <span className="text-[9px] font-bold text-gray-400 uppercase">No MN</span>
                        </label>
                      </div>
                      <input 
                        type="text"
                        disabled={editingRecord.noMiddleName}
                        value={editingRecord.middleName || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, middleName: e.target.value })}
                        onKeyDown={(e) => handleBackspaceClear(e, 'middleName')}
                        className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 disabled:opacity-50 ${isFieldIncomplete(editingRecord, 'middleName') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Surname</label>
                      <input 
                        type="text"
                        value={editingRecord.surname || ''}
                        onChange={(e) => setEditingRecord({ ...editingRecord, surname: e.target.value })}
                        onKeyDown={(e) => handleBackspaceClear(e, 'surname')}
                        className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'surname') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Patient Name</label>
                    <input 
                      type="text"
                      value={editingRecord.name || ''}
                      onChange={(e) => setEditingRecord({ ...editingRecord, name: e.target.value })}
                      onKeyDown={(e) => handleBackspaceClear(e, 'name')}
                      className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'name') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Hospital Number</label>
                  <input 
                    type="text"
                    value={editingRecord.hospNo || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hospNo: e.target.value })}
                    onKeyDown={(e) => handleBackspaceClear(e, 'hospNo')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'hospNo') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                <CompletorDropdown 
                  field="address"
                  label="Address"
                  items={addresses}
                  value={editingRecord.address || ''}
                  onSelect={(val) => setEditingRecord({ ...editingRecord, address: val })}
                  onAddNew={() => setShowAddAddressModal(true)}
                  incomplete={isFieldIncomplete(editingRecord, 'address')}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  isDeleteMode={isDeleteMode}
                  setIsDeleteMode={setIsDeleteMode}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  deleteMultipleItems={deleteMultipleItems}
                  handleBackspaceClear={handleBackspaceClear}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Birthdate</label>
                  <input 
                    type="date"
                    value={editingRecord.birthdate || ''}
                    onChange={(e) => {
                      const bday = e.target.value;
                      const age = calculateAge(bday);
                      setEditingRecord({ ...editingRecord, birthdate: bday, age: age });
                    }}
                    onKeyDown={(e) => handleBackspaceClear(e, 'birthdate')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'birthdate') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Age</label>
                  <input 
                    type="text"
                    value={editingRecord.age || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, age: e.target.value })}
                    onKeyDown={(e) => handleBackspaceClear(e, 'age')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'age') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sex</label>
                  <select 
                    value={editingRecord.sex || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, sex: e.target.value })}
                    onKeyDown={(e) => handleBackspaceClear(e, 'sex')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'sex') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  >
                    <option value="">Select Sex</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact No</label>
                  <input 
                    type="text"
                    value={editingRecord.contactNo || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, contactNo: e.target.value })}
                    onKeyDown={(e) => handleBackspaceClear(e, 'contactNo')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'contactNo') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
                <CompletorDropdown 
                  field="ward"
                  label="Point of Entry"
                  items={wards}
                  value={editingRecord.ward || ''}
                  onSelect={(val) => setEditingRecord({ 
                    ...editingRecord, 
                    ward: val,
                    typeOfAssistance: getAutoAssistance(val, editingRecord.amount || editingRecord.pfAmount || '0', editingRecord.modality || '')
                  })}
                  onAddNew={() => setShowAddWardModal(true)}
                  incomplete={isFieldIncomplete(editingRecord, 'ward')}
                  activeDropdown={activeDropdown}
                  setActiveDropdown={setActiveDropdown}
                  isDeleteMode={false}
                  setIsDeleteMode={setIsDeleteMode}
                  selectedItems={selectedItems}
                  setSelectedItems={setSelectedItems}
                  deleteMultipleItems={() => {}}
                  handleBackspaceClear={handleBackspaceClear}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
                    <span>Type of Assistance</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded tracking-normal">AUTOMATIC</span>
                      <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded tracking-normal">EDITABLE</span>
                    </div>
                  </label>
                  <input 
                    type="text"
                    value={editingRecord.typeOfAssistance || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, typeOfAssistance: e.target.value })}
                    placeholder="Assistance Type"
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-[#095161] ${isFieldIncomplete(editingRecord, 'typeOfAssistance') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Radiologist</label>
                  <select 
                    value={editingRecord.reader || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, reader: e.target.value })}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'reader') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  >
                    <option value="">Select Radiologist</option>
                    {RADIOLOGISTS.map(rad => (
                      <option key={rad} value={rad}>{rad}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">BILL REFERENCE</label>
                  <div className="flex flex-col gap-4 p-4 border-2 rounded-2xl bg-gray-50 border-transparent">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={editingRecord.withOR || false}
                        onChange={(e) => setEditingRecord({ ...editingRecord, withOR: e.target.checked })}
                        className="w-4 h-4 accent-[#095161]"
                      />
                      <span className="text-sm font-bold text-gray-700">Has OR?</span>
                    </label>
                    <input 
                      type="text"
                      value={editingRecord.withOR ? (editingRecord.orNumber || '') : (editingRecord.refNo || '')}
                      onChange={(e) => {
                        if (editingRecord.withOR) {
                          setEditingRecord({ ...editingRecord, orNumber: e.target.value });
                        } else {
                          setEditingRecord({ ...editingRecord, refNo: e.target.value });
                        }
                      }}
                      className={`w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#095161]/20 transition-all ${((editingRecord.withOR && !editingRecord.orNumber) || (!editingRecord.withOR && !editingRecord.refNo)) ? 'border-red-500 bg-red-50' : ''}`}
                      placeholder={editingRecord.withOR ? "Enter OR Number" : "Enter Ref Number"}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">TOTAL AMOUNT</label>
                  <input 
                    type="text"
                    value={editingRecord.amount || editingRecord.pfAmount || ''}
                    onChange={(e) => {
                      const newAmt = e.target.value;
                      setEditingRecord({ 
                        ...editingRecord, 
                        amount: newAmt, 
                        pfAmount: newAmt,
                        typeOfAssistance: getAutoAssistance(editingRecord.ward || '', newAmt, editingRecord.modality || '')
                      });
                    }}
                    onKeyDown={(e) => handleBackspaceClear(e, 'amount')}
                    className={`w-full p-4 border-2 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700 ${isFieldIncomplete(editingRecord, 'amount') ? 'border-red-500 bg-red-50' : 'border-transparent bg-gray-50'}`}
                  />
                </div>
              </div>

              <div className="mt-10 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRecord(null);
                  }}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    if (editingRecord) {
                      setConfirmModal({
                        show: true,
                        title: 'Confirm Save',
                        message: 'Do you want to save it?',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, show: false }));
                          const isSplit = editingRecord.modality === 'CT SCAN MAIN' || editingRecord.modality === 'CT SCAN OPD' || editingRecord.modality === 'X-RAY MAIN';
                          let fullName = editingRecord.name;
                          if (isSplit) {
                            fullName = `${editingRecord.givenName || ''} ${editingRecord.noMiddleName ? '' : (editingRecord.middleName || '')} ${editingRecord.surname || ''}`.replace(/\s+/g, ' ').trim();
                          }
                          updateRecord({ ...editingRecord, name: fullName || editingRecord.name });
                        },
                        confirmText: 'Yes, Save',
                        cancelText: 'Cancel',
                        variant: 'info'
                      });
                    }
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  SAVE
                </button>
                <button 
                  onClick={() => {
                    setConfirmModal({
                      show: true,
                      title: 'Confirm Save & Next',
                      message: 'Do you want to save it?',
                      onConfirm: () => {
                        setConfirmModal(prev => ({ ...prev, show: false }));
                        saveAndNext();
                      },
                      confirmText: 'Yes, Save & Next',
                      cancelText: 'Cancel',
                      variant: 'info'
                    });
                  }}
                  className="flex-1 py-4 bg-[#095161] text-white font-bold rounded-2xl shadow-lg hover:bg-[#0b6377] transition-all flex items-center justify-center gap-2"
                >
                  SAVE & NEXT
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Ward Modal */}
      <AnimatePresence>
        {showAddWardModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cyan-50">
                <h3 className="text-lg font-bold text-cyan-800">Add New Ward</h3>
                <button onClick={() => setShowAddWardModal(false)} className="text-cyan-400 hover:text-cyan-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newWardInput}
                  onChange={(e) => setNewWardInput(e.target.value.toUpperCase())}
                  placeholder="Enter Ward Name (e.g., ICU, WARD 1)"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-cyan-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddWardModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newWardInput.trim();
                      if (val) {
                        if (wards.includes(val)) {
                          showToast('Ward already exists', 'error');
                          return;
                        }
                        const updated = [...wards, val];
                        setWards(updated);
                        localStorage.setItem('claim_slip_wards', JSON.stringify(updated));
                        setNewWardInput('');
                        setShowAddWardModal(false);
                        showToast('Ward added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200"
                  >
                    ADD WARD
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Radiologist Modal */}
      <AnimatePresence>
        {showAddRadiologistModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cyan-50">
                <h3 className="text-lg font-bold text-cyan-800">Add New Radiologist</h3>
                <button onClick={() => setShowAddRadiologistModal(false)} className="text-cyan-400 hover:text-cyan-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newRadiologistInput}
                  onChange={(e) => setNewRadiologistInput(e.target.value.toUpperCase())}
                  placeholder="Enter Radiologist Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-cyan-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddRadiologistModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newRadiologistInput.trim();
                      if (val) {
                        if (radiologists.includes(val)) {
                          showToast('Radiologist already exists', 'error');
                          return;
                        }
                        const updated = [...radiologists, val];
                        setRadiologists(updated);
                        localStorage.setItem('claim_slip_radiologists', JSON.stringify(updated));
                        setNewRadiologistInput('');
                        setShowAddRadiologistModal(false);
                        showToast('Radiologist added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200"
                  >
                    ADD RADIOLOGIST
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Radiographer Modal */}
      <AnimatePresence>
        {showAddRadiographerModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-cyan-50">
                <h3 className="text-lg font-bold text-cyan-800">Add New Radiographer</h3>
                <button onClick={() => setShowAddRadiographerModal(false)} className="text-cyan-400 hover:text-cyan-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newRadiographerInput}
                  onChange={(e) => setNewRadiographerInput(e.target.value.toUpperCase())}
                  placeholder="Enter Radiographer Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-cyan-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddRadiographerModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newRadiographerInput.trim();
                      if (val) {
                        if (radiographers.includes(val)) {
                          showToast('Radiographer already exists', 'error');
                          return;
                        }
                        const updated = [...radiographers, val];
                        setRadiographers(updated);
                        localStorage.setItem('claim_slip_radiographers', JSON.stringify(updated));
                        setNewRadiographerInput('');
                        setShowAddRadiographerModal(false);
                        showToast('Radiographer added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-200"
                  >
                    ADD RADIOGRAPHER
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Physician Modal */}
      <AnimatePresence>
        {showAddPhysicianModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-50">
                <h3 className="text-lg font-bold text-indigo-800">Add New Physician</h3>
                <button onClick={() => setShowAddPhysicianModal(false)} className="text-indigo-400 hover:text-indigo-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newPhysicianInput}
                  onChange={(e) => setNewPhysicianInput(e.target.value.toUpperCase())}
                  placeholder="Enter Physician Name (e.g., DR. SMITH)"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddPhysicianModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newPhysicianInput.trim();
                      if (val) {
                        if (physicians.includes(val)) {
                          showToast('Physician already exists', 'error');
                          return;
                        }
                        const updated = [...physicians, val];
                        setPhysicians(updated);
                        localStorage.setItem('claim_slip_physicians', JSON.stringify(updated));
                        setNewPhysicianInput('');
                        setShowAddPhysicianModal(false);
                        showToast('Physician added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    ADD PHYSICIAN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddressModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
                <h3 className="text-lg font-bold text-emerald-800">Add New Address</h3>
                <button onClick={() => setShowAddAddressModal(false)} className="text-emerald-400 hover:text-emerald-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newAddressInput}
                  onChange={(e) => setNewAddressInput(e.target.value.toUpperCase())}
                  placeholder="Enter Address (Barangay, Municipality, Province)"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddAddressModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newAddressInput.trim();
                      if (val) {
                        if (addresses.includes(val)) {
                          showToast('Address already exists', 'error');
                          return;
                        }
                        const updated = [...addresses, val];
                        setAddresses(updated);
                        localStorage.setItem('claim_slip_addresses', JSON.stringify(updated));
                        setNewAddressInput('');
                        setShowAddAddressModal(false);
                        showToast('Address added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                  >
                    ADD ADDRESS
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Console Modal */}
      <AnimatePresence>
        {showAddConsoleModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-purple-50">
                <h3 className="text-lg font-bold text-purple-800">Add New Console</h3>
                <button onClick={() => setShowAddConsoleModal(false)} className="text-purple-400 hover:text-purple-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newConsoleInput}
                  onChange={(e) => setNewConsoleInput(e.target.value.toUpperCase())}
                  placeholder="Enter Console Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-purple-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddConsoleModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newConsoleInput.trim();
                      if (val) {
                        if (consoles.includes(val)) {
                          showToast('Console already exists', 'error');
                          return;
                        }
                        const updated = [...consoles, val];
                        setConsoles(updated);
                        localStorage.setItem('claim_slip_consoles', JSON.stringify(updated));
                        setNewConsoleInput('');
                        setShowAddConsoleModal(false);
                        showToast('Console added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                  >
                    ADD CONSOLE
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Exam Room Modal */}
      <AnimatePresence>
        {showAddExamRoomModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-orange-50">
                <h3 className="text-lg font-bold text-orange-800">Add New Exam Room</h3>
                <button onClick={() => setShowAddExamRoomModal(false)} className="text-orange-400 hover:text-orange-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newExamRoomInput}
                  onChange={(e) => setNewExamRoomInput(e.target.value.toUpperCase())}
                  placeholder="Enter Exam Room Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddExamRoomModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newExamRoomInput.trim();
                      if (val) {
                        if (examRooms.includes(val)) {
                          showToast('Exam Room already exists', 'error');
                          return;
                        }
                        const updated = [...examRooms, val];
                        setExamRooms(updated);
                        localStorage.setItem('claim_slip_exam_rooms', JSON.stringify(updated));
                        setNewExamRoomInput('');
                        setShowAddExamRoomModal(false);
                        showToast('Exam Room added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
                  >
                    ADD EXAM ROOM
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Recep Modal */}
      <AnimatePresence>
        {showAddRecepModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-pink-50">
                <h3 className="text-lg font-bold text-pink-800">Add New Recep</h3>
                <button onClick={() => setShowAddRecepModal(false)} className="text-pink-400 hover:text-pink-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newRecepInput}
                  onChange={(e) => setNewRecepInput(e.target.value.toUpperCase())}
                  placeholder="Enter Recep Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-pink-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddRecepModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newRecepInput.trim();
                      if (val) {
                        if (receps.includes(val)) {
                          showToast('Recep already exists', 'error');
                          return;
                        }
                        const updated = [...receps, val];
                        setReceps(updated);
                        localStorage.setItem('claim_slip_receps', JSON.stringify(updated));
                        setNewRecepInput('');
                        setShowAddRecepModal(false);
                        showToast('Recep added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-pink-600 text-white font-bold rounded-xl hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
                  >
                    ADD RECEP
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transfer Result By Modal */}
      <AnimatePresence>
        {showAddTransferResultByModal && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50">
                <h3 className="text-lg font-bold text-blue-800">Add New Transfer Result By</h3>
                <button onClick={() => setShowAddTransferResultByModal(false)} className="text-blue-400 hover:text-blue-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <input 
                  type="text"
                  value={newTransferResultByInput}
                  onChange={(e) => setNewTransferResultByInput(e.target.value.toUpperCase())}
                  placeholder="Enter Name"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAddTransferResultByModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all">CANCEL</button>
                  <button 
                    onClick={() => {
                      const val = newTransferResultByInput.trim();
                      if (val) {
                        if (transferResultBys.includes(val)) {
                          showToast('Transfer Result By already exists', 'error');
                          return;
                        }
                        const updated = [...transferResultBys, val];
                        setTransferResultBys(updated);
                        localStorage.setItem('claim_slip_transfer_result_bys', JSON.stringify(updated));
                        setNewTransferResultByInput('');
                        setShowAddTransferResultByModal(false);
                        showToast('Transfer Result By added successfully');
                      }
                    }}
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    ADD NAME
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* MAIFIPP Modal */}
      <AnimatePresence>
        {showMaifippModal && selectedDoctorForMaifipp && (
          <div className="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col border border-white/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-10 bg-gradient-to-br from-[#0da2c2] to-[#095161] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="flex flex-col relative z-10">
                  <h2 className="text-4xl font-black tracking-tight">{selectedDoctorForMaifipp}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-200">MAIFIPP Manager System</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 relative z-10">
                  {isAdminMode ? (
                    <div className="flex bg-[#073d4a]/50 p-1.5 rounded-[1.5rem] backdrop-blur-md border border-white/10">
                      <button 
                        onClick={() => {
                          setMaifippModalTab('pending');
                          setMaifippSelectedIds(new Set());
                        }}
                        className={`px-8 py-3 rounded-[1.1rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${maifippModalTab === 'pending' ? 'bg-white text-[#095161] shadow-xl scale-105' : 'text-cyan-100 hover:text-white hover:bg-white/5'}`}
                      >
                        Pending List
                      </button>
                      <button 
                        onClick={() => {
                          setMaifippModalTab('reported');
                          setMaifippSelectedIds(new Set());
                        }}
                        className={`px-8 py-3 rounded-[1.1rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${maifippModalTab === 'reported' ? 'bg-white text-[#095161] shadow-xl scale-105' : 'text-cyan-100 hover:text-white hover:bg-white/5'}`}
                      >
                        Reported History
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white/10 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/10 backdrop-blur-sm">
                      Reported History
                    </div>
                  )}
                  <button 
                    onClick={() => setShowMaifippModal(false)} 
                    className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all border border-white/20 hover:rotate-90"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-10 py-6 flex flex-col gap-5 overflow-hidden bg-white border-b border-gray-100/50">
                <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                  {/* Search */}
                  <div className="relative flex-grow max-w-sm group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-cyan-500 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search patients..."
                      value={maifippModalTab === 'pending' ? maifippSearch : maifippHistoryFilter}
                      onChange={(e) => {
                        if (maifippModalTab === 'pending') setMaifippSearch(e.target.value);
                        else setMaifippHistoryFilter(e.target.value);
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100/50 rounded-2xl focus:border-cyan-500 focus:bg-white outline-none transition-all font-bold text-xs text-gray-700 shadow-sm"
                    />
                  </div>

                  {/* Stats & Selection Info */}
                  <div className="flex items-center gap-3">
                    {/* Total Amount Badge */}
                    <div className="bg-[#f0f9fb] px-4 py-2 rounded-2xl border border-cyan-100 flex flex-col items-start shadow-sm">
                      <span className="text-[8px] font-black text-cyan-600/60 uppercase tracking-widest leading-none mb-1">Total Amount</span>
                      <span className="text-sm font-black text-[#095161]">
                        ₱ {records
                          .filter(r => 
                            r.reader === selectedDoctorForMaifipp && 
                            !r.isDeleted &&
                            (maifippModalTab === 'pending' ? !r.isReportedToMAIFIPP : r.isReportedToMAIFIPP) &&
                            (maifippModalTab === 'pending' 
                              ? (r.name.toLowerCase().includes(maifippSearch.toLowerCase()) || r.refNo.toLowerCase().includes(maifippSearch.toLowerCase()))
                              : (r.name.toLowerCase().includes(maifippHistoryFilter.toLowerCase()) || 
                                 r.refNo.toLowerCase().includes(maifippHistoryFilter.toLowerCase()) ||
                                 (r.maifippServiceMonth && r.maifippServiceMonth.toLowerCase().includes(maifippHistoryFilter.toLowerCase())))
                            )
                          )
                          .reduce((acc, r) => {
                            const val = (r.amount || r.pfAmount || '0').replace(/[^\d.]/g, '');
                            return acc + (parseFloat(val) || 0);
                          }, 0)
                          .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Selection Counter */}
                    {maifippSelectedIds.size > 0 && (
                      <div className="bg-amber-500 text-white px-3 py-2 rounded-2xl flex flex-col items-center shadow-lg shadow-amber-200 animate-in fade-in zoom-in duration-300">
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Selected</span>
                        <span className="text-sm font-black leading-none">{maifippSelectedIds.size}</span>
                      </div>
                    )}
                  </div>

                    {/* Month Selection Area */}
                    <div className={`p-1.5 px-4 rounded-2xl border transition-all flex items-center gap-4 min-w-[260px] ${
                      maifippModalTab === 'pending' && maifippSelectedIds.size > 0 
                        ? 'bg-amber-50 border-amber-200' 
                        : maifippModalTab === 'reported' ? 'bg-[#f4fbf8] border-emerald-100' : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${maifippModalTab === 'reported' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {maifippModalTab === 'pending' ? 'Report Month' : 'Filter Month'}
                        </span>
                        <div className="flex items-center gap-3">
                          <select 
                            value={maifippModalTab === 'pending' ? maifippBulkMonth.split('-')[1] : (maifippHistoryFilter.match(/^\d{4}-\d{2}/) ? maifippHistoryFilter.split('-')[1] : '')}
                            disabled={maifippModalTab === 'pending' && maifippSelectedIds.size === 0}
                            onChange={(e) => {
                              if (maifippModalTab === 'pending') {
                                const [y] = maifippBulkMonth.split('-');
                                setMaifippBulkMonth(`${y}-${e.target.value}`);
                              } else {
                                const [y] = (maifippHistoryFilter.match(/^\d{4}-\d{2}/) ? maifippHistoryFilter.split('-') : [new Date().getFullYear().toString()]);
                                if (!e.target.value) setMaifippHistoryFilter(y);
                                else setMaifippHistoryFilter(`${y}-${e.target.value}`);
                              }
                            }}
                            className={`bg-transparent border-none p-0 text-xs font-black outline-none cursor-pointer focus:ring-0 appearance-none min-w-[80px] ${
                              maifippModalTab === 'reported' ? 'text-emerald-900' : 'text-amber-900'
                            }`}
                          >
                            {maifippModalTab === 'reported' && <option value="">Full History</option>}
                            {[
                              { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
                              { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
                              { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
                              { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
                            ].map(m => (
                              <option key={m.v} value={m.v}>{m.l}</option>
                            ))}
                          </select>
                          
                          <input 
                            list={maifippModalTab === 'pending' ? "maifipp-bulk-years" : "maifipp-filter-years"}
                            type="text"
                            value={maifippModalTab === 'pending' ? maifippBulkMonth.split('-')[0] : (maifippHistoryFilter.match(/^\d{4}/) ? maifippHistoryFilter.split('-')[0] : (maifippHistoryFilter.match(/^\d+$/) ? maifippHistoryFilter : ''))}
                            disabled={maifippModalTab === 'pending' && maifippSelectedIds.size === 0}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (maifippModalTab === 'pending') {
                                const [, m] = maifippBulkMonth.split('-');
                                setMaifippBulkMonth(`${val}-${m}`);
                              } else {
                                const parts = maifippHistoryFilter.split('-');
                                const m = parts.length > 1 ? parts[1] : '';
                                if (!val && !m) setMaifippHistoryFilter('');
                                else if (!m) setMaifippHistoryFilter(val);
                                else setMaifippHistoryFilter(`${val}-${m}`);
                              }
                            }}
                            placeholder="Year"
                            className={`bg-white/40 border-none rounded-lg px-2 py-0.5 text-[10px] font-black outline-none w-14 text-center ${
                              maifippModalTab === 'reported' ? 'text-emerald-900' : 'text-amber-900 font-bold'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex items-center gap-2 ml-auto">
                    {isAdminMode && (
                      <div className="flex bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 shrink-0">
                        <button 
                          onClick={() => {
                            const searchLower = (maifippModalTab === 'pending' ? maifippSearch : maifippHistoryFilter).toLowerCase();
                            const docRecords = records.filter(r => 
                              r.reader === selectedDoctorForMaifipp && 
                              !r.isDeleted &&
                              (maifippModalTab === 'pending' ? !r.isReportedToMAIFIPP : r.isReportedToMAIFIPP) &&
                              (r.name.toLowerCase().includes(searchLower) || 
                               r.refNo.toLowerCase().includes(searchLower) ||
                               (maifippModalTab === 'reported' && r.maifippServiceMonth && r.maifippServiceMonth.toLowerCase().includes(searchLower))) &&
                              (maifippModalTab === 'reported' && maifippHistoryFilter && maifippHistoryFilter.match(/^\d{4}-\d{2}/) ? r.maifippServiceMonth === maifippHistoryFilter : true) &&
                              !r.isPaid
                            );
                            setMaifippSelectedIds(new Set(docRecords.map(r => r.id)));
                          }}
                          className="px-3 py-2 text-cyan-700 font-bold text-[9px] uppercase tracking-widest hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        >
                          Select All
                        </button>
                        <button 
                          onClick={() => setMaifippSelectedIds(new Set())}
                          className="px-3 py-2 text-gray-400 font-bold text-[9px] uppercase tracking-widest hover:bg-white hover:shadow-sm rounded-lg transition-all"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    {isAdminMode && (
                      <button 
                        disabled={maifippSelectedIds.size === 0}
                        onClick={() => {
                          const updatedRecords = records.map(r => {
                            if (maifippSelectedIds.has(r.id)) {
                              return {
                                ...r,
                                isReportedToMAIFIPP: maifippModalTab === 'pending',
                                maifippReportedAt: maifippModalTab === 'pending' ? new Date().toISOString() : undefined,
                                maifippServiceMonth: maifippModalTab === 'pending' ? maifippBulkMonth : undefined
                              };
                            }
                            return r;
                          });
                          
                          const count = maifippSelectedIds.size;
                          setRecords(updatedRecords);
                          setMaifippSelectedIds(new Set());
                          
                          if (maifippModalTab === 'pending') {
                            setMaifippModalTab('reported');
                            setMaifippHistoryFilter(maifippBulkMonth);
                          }
                          
                          showToast(`${count} records updated successfully`, 'success');
                        }}
                        className={`px-6 py-2.5 font-black text-[9px] uppercase tracking-[0.1em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale shrink-0 ${
                          maifippModalTab === 'pending' 
                            ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700' 
                            : 'bg-[#fb7185] text-white shadow-rose-200 hover:bg-rose-600'
                        }`}
                      >
                        {maifippModalTab === 'pending' ? <CheckCircle2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                        {maifippModalTab === 'pending' ? 'Report' : 'Undo'}
                      </button>
                    )}
                  </div>
                </div>

                {/* List Container */}
                <div className="flex-grow overflow-y-auto pr-6 -mr-6 custom-scrollbar min-h-[400px]">
                  <div className="flex flex-col gap-4 pb-10">
                    <AnimatePresence mode="popLayout">
                      {records
                        .filter(r => 
                          r.reader === selectedDoctorForMaifipp && 
                          !r.isDeleted &&
                          (maifippModalTab === 'pending' ? !r.isReportedToMAIFIPP : r.isReportedToMAIFIPP) &&
                          (maifippModalTab === 'pending' 
                            ? (r.name.toLowerCase().includes(maifippSearch.toLowerCase()) || r.refNo.toLowerCase().includes(maifippSearch.toLowerCase()))
                            : (r.name.toLowerCase().includes(maifippHistoryFilter.toLowerCase()) || 
                               r.refNo.toLowerCase().includes(maifippHistoryFilter.toLowerCase()) ||
                               (r.maifippServiceMonth && r.maifippServiceMonth.toLowerCase().includes(maifippHistoryFilter.toLowerCase())))
                          )
                        )
                        .sort((a, b) => new Date(b.rawDate || b.date).getTime() - new Date(a.rawDate || a.date).getTime())
                        .map((record) => {
                          const isReported = record.isReportedToMAIFIPP;
                          const isSelected = maifippSelectedIds.has(record.id);
                          const isPaid = record.isPaid;

                          return (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              key={record.id}
                              onClick={() => {
                                if (isPaid) return;
                                if (maifippModalTab === 'pending' || (maifippModalTab === 'reported' && isAdminMode)) {
                                  const newSelected = new Set(maifippSelectedIds);
                                  if (newSelected.has(record.id)) {
                                    newSelected.delete(record.id);
                                  } else {
                                    newSelected.add(record.id);
                                  }
                                  setMaifippSelectedIds(newSelected);
                                }
                              }}
                              className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex items-center justify-between cursor-pointer relative overflow-hidden group shadow-sm ${
                                isSelected ? 'border-cyan-500 bg-cyan-50/50 scale-[1.01] shadow-xl shadow-cyan-100/50' :
                                isPaid ? 'border-gray-100 bg-gray-50/50 opacity-60 grayscale cursor-not-allowed shadow-none' :
                                isReported 
                                  ? 'border-emerald-100 bg-[#f4fbf8] hover:border-emerald-300' 
                                  : 'border-gray-100 bg-white hover:border-cyan-300 hover:shadow-lg'
                              } ${(!isAdminMode && maifippModalTab === 'reported') ? 'cursor-default pointer-events-none' : ''}`}
                            >
                              <div className="flex items-center gap-6 flex-grow min-w-0 z-10">
                                {/* Checkbox/Status Icon */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 duration-500 ${
                                  isSelected ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200 rotate-12' :
                                  isPaid ? 'bg-gray-200 text-gray-400' :
                                  isReported 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
                                    : 'bg-gray-100 text-gray-300 group-hover:bg-cyan-100 group-hover:text-cyan-500 shadow-inner'
                                }`}>
                                  {isSelected ? <CheckSquare className="w-7 h-7" /> : isPaid ? <CreditCard className="w-7 h-7" /> : isReported ? <CheckCircle2 className="w-7 h-7" /> : <Square className="w-5 h-5" />}
                                </div>

                                <div className="flex flex-col min-w-0 flex-grow py-1">
                                  <div className="flex items-center gap-4 flex-wrap">
                                    <span className={`text-xl font-black tracking-tight truncate leading-tight ${isSelected ? 'text-[#095161]' : isReported ? 'text-emerald-950' : 'text-gray-800'}`}>
                                      {record.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        isSelected ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-400'
                                      }`}>{record.modality}</span>
                                      {isPaid && (
                                        <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200/50">
                                          <div className="w-1 h-1 rounded-full bg-emerald-600" />
                                          PAID
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span className="text-xs font-bold">{record.date}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <span className="text-xs font-bold text-gray-300">HOSP: {record.hospNo}</span>
                                  </div>
                                </div>

                                {/* Reference Number - Centered and Styled */}
                                <div className="hidden lg:flex flex-col items-center justify-center px-8 border-x border-gray-100/50">
                                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Reference No</span>
                                  <span className={`text-sm font-black tracking-widest ${isSelected ? 'text-cyan-600' : 'text-gray-500'}`}>
                                    {record.refNo}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-10 shrink-0 ml-8 z-10">
                                {/* Amount */}
                                <div className="flex flex-col items-end min-w-[120px]">
                                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Amount</span>
                                  <span className={`text-2xl font-black tracking-tighter ${isSelected ? 'text-cyan-700' : isReported ? 'text-emerald-600' : 'text-[#0da2c2]'}`}>
                                    ₱ {((r) => {
                                      const val = (r.amount || r.pfAmount || '0').replace(/[^\d.]/g, '');
                                      return (parseFloat(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
                                    })(record)}
                                  </span>
                                </div>

                                {/* Service Month Badge/Editor */}
                                {isReported && (
                                  <div className="flex items-center bg-white shadow-inner border border-gray-100 rounded-2xl p-2 px-4 gap-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Service Month</span>
                                      {isAdminMode ? (
                                        <input 
                                          type="month"
                                          value={record.maifippServiceMonth || ''}
                                          onChange={(e) => {
                                            setRecords(prev => prev.map(r => r.id === record.id ? { 
                                              ...r, 
                                              maifippServiceMonth: e.target.value 
                                            } : r));
                                          }}
                                          className="bg-transparent border-none p-0 text-sm font-black text-[#095161] focus:ring-0 outline-none w-28"
                                        />
                                      ) : (
                                        <span className="text-sm font-black text-[#095161]">{record.maifippServiceMonth || 'N/A'}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>

              {/* Footer */}
              <div className="p-10 pt-0 flex justify-end bg-white">
                <button 
                  onClick={() => setShowMaifippModal(false)}
                  className="px-14 py-5 bg-[#095161] text-white font-black text-sm uppercase tracking-[0.3em] rounded-[1.5rem] hover:bg-[#073d4a] transition-all shadow-2xl shadow-[#095161]/30 active:scale-95 flex items-center gap-3 group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modality Modal */}
      <AnimatePresence>
        {showAddModalityModal && (
          <div className="fixed inset-0 z-[60000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModalityModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#095161]/10 rounded-2xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-[#095161]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800">Add New Modality</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">System Configuration</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Modality Name</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. ULTRASOUND"
                      value={modalityInput}
                      onChange={(e) => setModalityInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddModality()}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#095161] focus:bg-white outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowAddModalityModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddModality}
                    disabled={!modalityInput.trim()}
                    className="flex-1 py-4 bg-[#095161] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#0b6377] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-cyan-900/20"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User History Modal */}
      <AnimatePresence>
        {showHistoryModal && selectedUserForHistory && (
          <div className="fixed inset-0 z-[60000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHistoryModal(false);
                setSelectedUserForHistory(null);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#095161]/10 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-[#095161]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-800">Login History</h3>
                      <p className="text-xs text-[#095161] font-black uppercase tracking-widest">{selectedUserForHistory.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowHistoryModal(false);
                        setSelectedUserForHistory(null);
                        setHistoryStartDate('');
                        setHistoryEndDate('');
                        setShowClearedHistory(false);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
                    <input 
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-gray-600 outline-none focus:border-[#095161] transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">End Date</label>
                    <input 
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-gray-600 outline-none focus:border-[#095161] transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Log List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const displayHistory = (selectedUserForHistory.loginHistory || []);

                    const filteredHistory = displayHistory.filter((h: any) => {
                      const timestamp = new Date(h.timestamp).getTime();
                      if (historyStartDate) {
                        const start = new Date(historyStartDate);
                        start.setHours(0, 0, 0, 0);
                        if (timestamp < start.getTime()) return false;
                      }
                      if (historyEndDate) {
                        const end = new Date(historyEndDate);
                        end.setHours(23, 59, 59, 999);
                        if (timestamp > end.getTime()) return false;
                      }
                      return true;
                    });

                    if (filteredHistory.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-sm font-bold text-slate-400">No History of Log-in</p>
                        </div>
                      );
                    }

                    return filteredHistory.map((h: any, idx: number) => {
                      return (
                        <div 
                          key={idx} 
                          className="flex gap-4 p-4 rounded-2xl border transition-all bg-slate-50/50 border-slate-100 items-center"
                        >
                          <div className="w-10 h-10 bg-white border-slate-100 text-[#095161] rounded-xl shadow-sm border flex items-center justify-center flex-shrink-0 transition-colors">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-black text-gray-700">
                              {new Date(h.timestamp).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                {h.platform || 'Unknown Platform'}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="text-[9px] font-bold truncate max-w-[200px] text-gray-400" title={h.userAgent}>
                                {h.userAgent || 'No data'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedUserForHistory(null);
                    setHistoryStartDate('');
                    setHistoryEndDate('');
                    setShowClearedHistory(false);
                    setSelectedHistoryItems(new Set());
                  }}
                  className="w-full mt-8 py-4 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 active:scale-95 transition-all"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
