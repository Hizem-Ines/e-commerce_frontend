const Field = ({ label, required, children }) => (
    <div>
        <label className="block text-xs font-bold text-black/50 uppercase tracking-wider mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

export default Field;