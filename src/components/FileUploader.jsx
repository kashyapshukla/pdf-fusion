import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, GripVertical, Lock, Unlock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';

const FileUploader = ({ files, onFilesChange }) => {
    const [processingFiles, setProcessingFiles] = useState({});

    const checkFileEncryption = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            await PDFDocument.load(arrayBuffer);
            return false; // Not encrypted
        } catch (error) {
            if (error.message.includes('scrambled') || error.message.includes('encrypted')) {
                return true; // Encrypted
            }
            return false; // Likely corrupted or other error, treat as check passed to let merger handle it
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const pdfs = acceptedFiles.filter(file => file.type === 'application/pdf');

        const newFilesWithId = pdfs.map(file => ({
            id: crypto.randomUUID(),
            file,
            name: file.name,
            size: file.size,
            isLocked: false,
            password: '',
            isChecking: true
        }));

        // Add placeholders immediately
        onFilesChange(prev => [...prev, ...newFilesWithId]);

        // Check encryption for each file
        for (const fileObj of newFilesWithId) {
            const isLocked = await checkFileEncryption(fileObj.file);

            onFilesChange(prev => prev.map(f => {
                if (f.id === fileObj.id) {
                    return { ...f, isLocked, isChecking: false };
                }
                return f;
            }));
        }
    }, [onFilesChange]);

    const updatePassword = (id, password) => {
        onFilesChange(files.map(f => f.id === id ? { ...f, password } : f));
    };

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: true
    });

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div
                {...getRootProps()}
                className={`glass-panel p-10 text-center cursor-pointer transition-all border-2 border-dashed
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-slate-600 hover:border-slate-500'}
        `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-full">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-xl font-medium mb-1">
                            {isDragActive ? 'Drop PDFs here' : 'Drop your PDFs here'}
                        </p>
                        <p className="text-slate-400">or click to browse</p>
                    </div>
                </div>
            </div>

            <Reorder.Group axis="y" values={files} onReorder={onFilesChange} className="space-y-3">
                <AnimatePresence mode='popLayout'>
                    {files.map((fileObj, index) => (
                        <Reorder.Item
                            key={fileObj.id}
                            value={fileObj}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`glass-panel p-4 flex flex-col gap-3 cursor-grab active:cursor-grabbing ${fileObj.isLocked ? 'border-red-500/30 bg-red-500/5' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <GripVertical className="w-5 h-5 text-slate-500" />
                                    <div className={`p-2 rounded-lg ${fileObj.isLocked ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                                        {fileObj.isChecking ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        ) : fileObj.isLocked ? (
                                            <Lock className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <FileText className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="truncate text-left">
                                        <p className="font-medium truncate text-white">{fileObj.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {fileObj.isLocked && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="pl-10 pr-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="password"
                                            placeholder="Enter file password"
                                            value={fileObj.password}
                                            onChange={(e) => updatePassword(fileObj.id, e.target.value)}
                                            className="flex-1 bg-slate-800/50 border border-slate-600 rounded px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <p className="text-xs text-red-400 mt-1 pl-1">
                                        Password required to merge this file.
                                    </p>
                                </motion.div>
                            )}
                        </Reorder.Item>
                    ))}
                </AnimatePresence>
            </Reorder.Group>
        </div>
    );
};

export default FileUploader;
