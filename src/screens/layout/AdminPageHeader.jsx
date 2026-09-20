export default function AdminPageHeader({ title, description, actions }) {
  return (
    <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-neutral-200 bg-white">
      <div>
        <h1 className="text-h2 text-neutral-900">{title}</h1>
        {description && <p className="text-body-sm text-neutral-500 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
