import React, { useState, useEffect, useRef } from 'react';
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
  X,
  CheckCircle,
  Info,
  Settings,
  Edit2,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Record {
  id: number;
  title: string;
  date: string;
  hospNo: string;
  name: string;
  exam: string;
  refNo: string;
  amount: string;
  reader: string;
  release: string;
  showReleaseSchedule: boolean;
  isDeleted: boolean;
}

interface ClaimSlipGeneratorProps {
  onLogout: () => void;
  username: string;
}

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

const DEFAULT_MODALITIES = [
  "X-RAY", 
  "X-RAY MAIN", 
  "X-RAY OPD", 
  "MRI", 
  "CT SCAN", 
  "CT SCAN MAIN", 
  "CT SCAN OPD", 
  "MAMMO", 
  "UTZ", 
  "UTZ MAIN", 
  "UTZ OPD"
];
const RELEASE_TIMES = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM"
];

export default function ClaimSlipGenerator({ onLogout, username }: ClaimSlipGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'records'>('generator');
  const [modality, setModality] = useState('X-RAY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hospNo, setHospNo] = useState('');
  const [name, setName] = useState('');
  const [exam, setExam] = useState('');
  const [refNo, setRefNo] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [reader, setReader] = useState('');
  const [newReaderName, setNewReaderName] = useState('');
  const [relDate, setRelDate] = useState(new Date().toISOString().split('T')[0]);
  const [relTime, setRelTime] = useState('1:00 PM - 3:00 PM');
  const [customTimeText, setCustomTimeText] = useState('');
  const [customTimeEnd, setCustomTimeEnd] = useState('');
  const [showReleaseSchedule, setShowReleaseSchedule] = useState(false);
  const [isOthersReader, setIsOthersReader] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  
  const [records, setRecords] = useState<Record[]>(() => {
    const saved = localStorage.getItem('claim_slip_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showWarning, setShowWarning] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showModalityManager, setShowModalityManager] = useState(false);
  const [modalities, setModalities] = useState<string[]>(() => {
    const saved = localStorage.getItem('claim_slip_modalities');
    return saved ? JSON.parse(saved) : DEFAULT_MODALITIES;
  });
  const [newModalityInput, setNewModalityInput] = useState('');
  const [editingModalityIndex, setEditingModalityIndex] = useState<number | null>(null);
  const [editingModalityValue, setEditingModalityValue] = useState('');
  
  const [printData, setPrintData] = useState<Record | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalReader = reader;
    if (reader === "OTHERS") {
      if (!newReaderName) { setShowWarning(true); return; }
      finalReader = "Dr. " + newReaderName.toUpperCase();
    }

    let finalTime = relTime;
    if (relTime === "CUSTOM") {
      if (!customTimeText || !customTimeEnd) { setShowWarning(true); return; }
      
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

    if (!date || !hospNo || !name || !exam || !refNo || !amount) {
      setShowWarning(true);
      return;
    }

    const newRecord: Record = {
      id: Date.now(),
      title: `${modality} OFFICIAL READING CLAIM SLIP`,
      date: formatDate(date),
      hospNo,
      name: name.toUpperCase(),
      exam: exam.toUpperCase(),
      refNo,
      amount: amount.startsWith('₱') ? amount : "₱ " + amount,
      reader: finalReader.toUpperCase(),
      release: `${formatDate(relDate)} @ ${finalTime}`,
      showReleaseSchedule,
      isDeleted: false
    };

    setRecords([newRecord, ...records]);
    setPrintData(newRecord);
    setShowPreview(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const clearForm = () => {
    setHospNo('');
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
        setRecords(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true } : r));
        showToast('Record moved to trash');
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const restoreRecord = (id: number) => {
    setRecords(records.map(r => r.id === id ? { ...r, isDeleted: false } : r));
    showToast('Record restored successfully');
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
        setRecords(prev => prev.filter(r => r.id !== id));
        showToast('Record permanently deleted', 'error');
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const exportToExcel = () => {
    const exportData = records.filter(r => !r.isDeleted).map(({ id, isDeleted, title, ...rest }) => rest);
    if (exportData.length === 0) { alert("No records!"); return; }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ClaimSlips");
    XLSX.writeFile(workbook, "Claim_Slip_Records.xlsx");
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = records
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

  const batchAction = (action: 'delete' | 'restore' | 'purge') => {
    if (selectedIds.size === 0) return;
    
    let title = '';
    let msg = '';
    let variant: 'danger' | 'warning' | 'info' = 'danger';
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
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, isDeleted: true } : r));
          showToast(`${selectedIds.size} records moved to trash`);
        } else if (action === 'restore') {
          setRecords(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, isDeleted: false } : r));
          showToast(`${selectedIds.size} records restored`);
        } else if (action === 'purge') {
          setRecords(prev => prev.filter(r => !selectedIds.has(r.id)));
          showToast(`${selectedIds.size} records purged`, 'error');
        }
        setSelectedIds(new Set());
        setConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans print:p-0">
      {/* Print Wrapper */}
      <div id="print-wrapper" className="hidden print:flex print:fixed print:inset-0 print:bg-white print:z-[9999] print:justify-center print:items-start print:pt-[0.2in]">
        {printData && (
          <div className="w-[2in] h-[2in] p-[0.1in] border-2 border-black relative bg-white overflow-hidden box-border flex flex-col">
            <div className="absolute top-[5px] right-[5px] w-[40px] h-[40px]">
              <QRCodeSVG value={printData.refNo || "N/A"} size={40} />
            </div>
            <div className="font-black text-[7pt] underline mb-1 mr-[45px] text-left uppercase leading-tight decoration-1 underline-offset-2">
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
        )}
      </div>

      {/* Main UI */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden print:hidden">
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
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'generator' 
                ? 'text-[#095161] border-[#095161]' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            GENERATOR
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-4 font-bold text-sm transition-all border-b-2 ${
              activeTab === 'records' 
                ? 'text-[#095161] border-[#095161]' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            RECORDS
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'generator' ? (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-[#095161] border-b pb-4 mb-6">
                {modality} Official Reading Claim Slip
              </h2>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Hospital No.
                  </label>
                  <input 
                    type="text"
                    value={hospNo}
                    onChange={(e) => setHospNo(e.target.value)}
                    placeholder="Enter Hospital ID"
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-3 h-3" /> Patient Name
                  </label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Examination
                  </label>
                  <input 
                    type="text"
                    value={exam}
                    onChange={(e) => setExam(e.target.value)}
                    placeholder="Type of Exam"
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Reference No.
                  </label>
                  <input 
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="Ref #"
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-3 h-3" /> Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                    <input 
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
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
                    }}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
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
                      onChange={(e) => setNewReaderName(e.target.value)}
                      placeholder="Enter Doctor's Name"
                      className="w-full mt-2 p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
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
                        onChange={(e) => setRelDate(e.target.value)}
                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all"
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
                              onChange={(e) => setCustomTimeText(e.target.value)}
                              className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all cursor-pointer"
                              title="Start Time"
                            />
                            <span className="font-bold text-gray-400">TO</span>
                            <input 
                              type="time"
                              value={customTimeEnd}
                              onChange={(e) => setCustomTimeEnd(e.target.value)}
                              className="flex-1 p-3 border-2 border-gray-100 rounded-xl focus:border-[#095161] outline-none transition-all cursor-pointer"
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
                    PREVIEW & PRINT
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
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-[#095161]">Transaction Records</h2>
                <button 
                  onClick={exportToExcel}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Export to Excel
                </button>
              </div>

              <AnimatePresence>
                {selectedIds.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#095161]/5 border-2 border-[#095161] p-4 rounded-2xl flex items-center justify-between"
                  >
                    <span className="font-bold text-[#095161]">{selectedIds.size} Selected</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => batchAction('delete')}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                      {isAdminMode && (
                        <>
                          <button 
                            onClick={() => batchAction('restore')}
                            className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" /> Restore
                          </button>
                          <button 
                            onClick={() => batchAction('purge')}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Purge
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#095161] text-white">
                    <tr>
                      <th className="p-4 w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#095161]"
                        />
                      </th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Hosp No.</th>
                      <th className="p-4">Patient Name</th>
                      <th className="p-4">Exam</th>
                      <th className="p-4">Ref No.</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Reader</th>
                      <th className="p-4">Release</th>
                      <th className="p-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {records.map((record) => {
                      if (record.isDeleted && !isAdminMode) return null;
                      return (
                        <tr 
                          key={record.id} 
                          className={`${record.isDeleted ? 'bg-red-50 text-red-400 line-through' : 'hover:bg-gray-50'}`}
                        >
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(record.id)}
                              onChange={() => toggleRecordSelection(record.id)}
                              className="w-4 h-4 rounded accent-[#095161]"
                            />
                          </td>
                          <td className="p-4">{record.date}</td>
                          <td className="p-4 font-mono">{record.hospNo}</td>
                          <td className="p-4 font-bold">{record.name}</td>
                          <td className="p-4">{record.exam}</td>
                          <td className="p-4 font-mono">{record.refNo}</td>
                          <td className="p-4 font-bold">{record.amount}</td>
                          <td className="p-4">{record.reader}</td>
                          <td className="p-4">{record.release}</td>
                          <td className="p-4">
                            <div className="flex gap-1">
                              {!record.isDeleted ? (
                                <>
                                  <button 
                                    onClick={() => {
                                      setPrintData(record);
                                      setShowPreview(true);
                                    }}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Print Preview"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => deleteRecord(record.id)}
                                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => restoreRecord(record.id)}
                                    className="p-2 bg-cyan-100 text-cyan-600 rounded-lg hover:bg-cyan-200 transition-colors"
                                    title="Restore Record"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => permanentDelete(record.id)}
                                    className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                    title="Permanently Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center gap-3">
                <div 
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${isAdminMode ? 'bg-[#095161]' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAdminMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <label className="text-sm font-bold text-gray-600 flex items-center gap-2 cursor-pointer" onClick={() => setIsAdminMode(!isAdminMode)}>
                  <Shield className="w-4 h-4" />
                  ADMIN MODE (Show/Restore/Purge Deleted)
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modality Manager Modal */}
      <AnimatePresence>
        {showModalityManager && (
          <div className="fixed inset-0 z-[16000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
            className={`fixed bottom-8 left-1/2 z-[20000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
          <div className="fixed inset-0 z-[17000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && printData && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto print:hidden">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-5xl w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Printer className="w-6 h-6 text-[#095161]" />
                  <h3 className="text-xl font-bold text-[#095161]">Print Preview</h3>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="bg-gray-50 p-8 rounded-2xl mb-8 flex justify-center overflow-auto max-h-[65vh] border-2 border-dashed border-gray-200">
                <div className="scale-[1.5] md:scale-[2] origin-top transition-transform">
                  {printData && (
                    <div className="w-[2in] h-[2in] p-[0.1in] border-2 border-black relative bg-white overflow-hidden box-border flex flex-col shadow-2xl">
                      <div className="absolute top-[5px] right-[5px] w-[40px] h-[40px]">
                        <QRCodeSVG value={printData.refNo || "N/A"} size={40} />
                      </div>
                      <div className="font-black text-[7pt] underline mb-1 mr-[45px] text-left uppercase leading-tight decoration-1 underline-offset-2">
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
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    window.print();
                    setShowPreview(false);
                    showToast('Print command sent to browser');
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-[#095161] to-[#0b6377] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Printer className="w-6 h-6" />
                  CONFIRM & PRINT NOW
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
