// components/admin/CategoryImageUpload.jsx
import { useState } from 'react';
import api from '../../services/api';

const CategoryImageUpload = ({ category, onUpdated }) => {
    const [preview, setPreview] = useState(
        Array.isArray(category.images) && category.images[0]?.url
            ? category.images[0].url
            : null
    );
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local preview immediately
        setPreview(URL.createObjectURL(file));
        setLoading(true);

        const formData = new FormData();
        formData.append('images', file);

        try {
            const res = await api.put(`/categories/${category.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data.success) {
                onUpdated?.(res.data.category);
            }
        } catch (err) {
            console.error('Upload échoué :', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <label className="cursor-pointer group relative block w-10 h-10">
            {/* Image or placeholder */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#f9f5f0] flex items-center justify-center border border-gray-100">
                {preview
                    ? <img src={preview} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg">🌿</span>
                }
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                {loading
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <span className="text-white text-xs">✎</span>
                }
            </div>

            {/* Hidden file input — clicking the label triggers this */}
            <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />
        </label>
    );
};

export default CategoryImageUpload;