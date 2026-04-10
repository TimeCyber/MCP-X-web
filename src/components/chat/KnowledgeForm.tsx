import React, { useState, useLayoutEffect } from 'react';
import { KnowledgeInfo } from '../../types';
import { toast } from '../../utils/toast';

interface KnowledgeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (knowledge: KnowledgeInfo) => Promise<void>;
  editingKnowledge?: KnowledgeInfo | null;
}

export const KnowledgeForm: React.FC<KnowledgeFormProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  editingKnowledge 
}) => {
  const [formData, setFormData] = useState<KnowledgeInfo>(() => ({
    kname: editingKnowledge?.kname || '',
    share: editingKnowledge?.share || 0,
    description: editingKnowledge?.description || '',
    // 使用最优化的默认参数
    knowledgeSeparator: '\n',
    questionSeparator: '\n',
    overlapChar: 50,
    retrieveLimit: 5,
    textBlockSize: 300,
    vectorModelName: 'weaviate',
    embeddingModelName: 'text-embedding-v4',//text-embedding-ada-002
    systemPrompt: '',
    remark: ''
  }));

  const [loading, setLoading] = useState(false);

  // 当弹窗状态或编辑对象变化时，同步回填表单数据（在首帧前执行，避免空白闪烁）
  useLayoutEffect(() => {
    if (editingKnowledge) {
      setFormData({
        kname: editingKnowledge.kname || '',
        share: editingKnowledge.share ?? 0,
        description: editingKnowledge.description || '',
        knowledgeSeparator: editingKnowledge.knowledgeSeparator || '\n',
        questionSeparator: editingKnowledge.questionSeparator || '\n',
        overlapChar: editingKnowledge.overlapChar ?? 50,
        retrieveLimit: editingKnowledge.retrieveLimit ?? 5,
        textBlockSize: editingKnowledge.textBlockSize ?? 300,
        vectorModelName: editingKnowledge.vectorModelName || 'weaviate',
        embeddingModelName: editingKnowledge.embeddingModelName || 'text-embedding-v4',
        systemPrompt: editingKnowledge.systemPrompt || '',
        remark: editingKnowledge.remark || ''
      });
    } else {
      setFormData({
        kname: '',
        share: 0,
        description: '',
        knowledgeSeparator: '\n',
        questionSeparator: '\n',
        overlapChar: 50,
        retrieveLimit: 5,
        textBlockSize: 300,
        vectorModelName: 'weaviate',
        embeddingModelName: 'text-embedding-v4',
        systemPrompt: '',
        remark: ''
      });
    }
  }, [editingKnowledge, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      if (name === 'share') {
        return { ...prev, share: Number(value) };
      }
      return {
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.kname.trim()) {
      toast.error('知识库名称不能为空');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        ...(editingKnowledge && { id: editingKnowledge.id, kid: editingKnowledge.kid })
      });
      toast.success(editingKnowledge ? '更新知识库成功！' : '创建知识库成功！');
      onClose();
      // 重置表单
      setFormData({
        kname: '',
        share: 0,
        description: '',
        // 使用最优化的默认参数
        knowledgeSeparator: '\n',
        questionSeparator: '\n',
        overlapChar: 50,
        retrieveLimit: 5,
        textBlockSize: 300,
        vectorModelName: 'weaviate',
        embeddingModelName: 'text-embedding-v4',
        systemPrompt: '',
        remark: ''
      });
    } catch (error: any) {
      console.error('保存知识库失败:', error);
      toast.error(error.message || '保存知识库失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">
            {editingKnowledge ? '编辑知识库' : '新增知识库'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 知识库名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              知识库名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="kname"
              value={formData.kname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入知识库名称"
              required
              disabled={loading}
            />
          </div>

          {/* 是否公开 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              是否公开
            </label>
            <select
              name="share"
              value={String(formData.share)}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="0">否</option>
              <option value="1">是</option>
            </select>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              描述
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="请输入知识库描述（最多100字）"
              disabled={loading}
            />
            <div className="text-xs text-slate-400 mt-1 text-right">{(formData.description || '').length}/100</div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? '保存中...' : (editingKnowledge ? '更新' : '创建')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
