
import React, { useState, useRef, useEffect } from 'react';
import type { Board } from '../../types';

interface BoardPanelProps {
    isOpen: boolean;
    onClose: () => void;
    boards: Board[];
    activeBoardId: string;
    onSwitchBoard: (id: string) => void;
    onAddBoard: () => void;
    onRenameBoard: (id: string, name: string) => void;
    onDuplicateBoard: (id: string) => void;
    onDeleteBoard: (id: string) => void;
    generateBoardThumbnail: (elements: Board['elements']) => string;
}

const BoardItem: React.FC<{
    board: Board;
    isActive: boolean;
    thumbnail: string;
    onClick: () => void;
    onRename: (name: string) => void;
    onDuplicate: () => void;
    onDelete: () => void;
}> = ({ board, isActive, thumbnail, onClick, onRename, onDuplicate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(board.name);
    const [menuOpen, setMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setName(board.name);
    }, [board.name]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBlur = () => {
        setIsEditing(false);
        if (name.trim() === '') {
            setName(board.name);
        } else if (name.trim() !== board.name) {
            onRename(name.trim());
        }
    };
    
    const handleMenuAction = (action: 'rename' | 'duplicate' | 'delete') => {
        setMenuOpen(false);
        switch (action) {
            case 'rename':
                setIsEditing(true);
                break;
            case 'duplicate':
                onDuplicate();
                break;
            case 'delete':
                if (window.confirm(`Are you sure you want to delete "${board.name}"?`)) {
                    onDelete();
                }
                break;
        }
    };

    return (
        <div 
            onClick={onClick}
            className={`group relative p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-500/30' : 'hover:bg-white/10'}`}
        >
            <div className={`aspect-[3/2] w-full rounded-md mb-2 overflow-hidden border-2 ${isActive ? 'border-blue-500' : 'border-transparent'} relative`}>
                <img src={thumbnail} alt={`${board.name} thumbnail`} className="w-full h-full object-cover" />
                {board.isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-xs text-white/80">加载中...</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between">
                {isEditing ? (
                     <input
                        ref={inputRef}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        className="w-full bg-transparent border-b border-blue-400 outline-none text-white text-sm"
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className="text-sm truncate" onDoubleClick={() => setIsEditing(true)}>{board.name}</span>
                )}
               
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }} 
                        className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 z-10 w-32 bg-neutral-800 rounded-md shadow-lg border border-white/10 py-1 text-sm">
                            <button onClick={() => handleMenuAction('rename')} className="block w-full text-left px-3 py-1.5 hover:bg-white/10">Rename</button>
                            <button onClick={() => handleMenuAction('duplicate')} className="block w-full text-left px-3 py-1.5 hover:bg-white/10">Duplicate</button>
                            <div className="my-1 border-t border-white/10"></div>
                            <button onClick={() => handleMenuAction('delete')} className="block w-full text-left px-3 py-1.5 hover:bg-red-500/20 text-red-400">Delete</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export const BoardPanel: React.FC<BoardPanelProps> = ({ 
    isOpen, onClose, boards, activeBoardId, onSwitchBoard, onAddBoard, 
    onRenameBoard, onDuplicateBoard, onDeleteBoard, generateBoardThumbnail 
}) => {
    if (!isOpen) return null;

    return (
         <div 
            className="absolute top-20 left-4 z-50 flex flex-col w-64 h-[calc(100vh-6rem)] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl text-white overflow-hidden"
            style={{ backgroundColor: 'var(--ui-bg-color)' }}
        >
            <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-white/10">
                <h3 className="text-base font-semibold">Boards</h3>
                <div className="flex items-center space-x-1">
                    <button onClick={onAddBoard} className="text-gray-300 hover:text-white p-1.5 rounded-full hover:bg-white/10" title="New Board">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-full">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>
            <div className="flex-grow p-2 overflow-y-auto grid grid-cols-2 gap-2 content-start">
                 {boards.map(board => (
                     <BoardItem 
                        key={board.id}
                        board={board}
                        isActive={board.id === activeBoardId}
                        thumbnail={generateBoardThumbnail(board.elements)}
                        onClick={() => onSwitchBoard(board.id)}
                        onRename={(name) => onRenameBoard(board.id, name)}
                        onDuplicate={() => onDuplicateBoard(board.id)}
                        onDelete={() => onDeleteBoard(board.id)}
                     />
                 ))}
            </div>
        </div>
    );
};
