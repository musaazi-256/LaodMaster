import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import DocumentUploadCard from '../../components/identity/DocumentUploadCard';
import Button from '../../components/actions/Button';

const DOCS = [
  { id: 'license', label: 'Driving permit' },
  { id: 'logbook', label: 'Vehicle logbook' },
  { id: 'insurance', label: 'Insurance certificate' },
  { id: 'photo', label: 'Vehicle photo' },
];

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  const [uploading, setUploading] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const uploadedTypes = new Set(driver.documents.map((d) => d.docType));
  const allUploaded = DOCS.every((d) => uploadedTypes.has(d.id));

  async function handleUpload(docType) {
    setUploading(docType);
    await driver.uploadDocument(docType);
    setUploading(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    await driver.submitForReview();
    navigate('/driver/register/submitted');
  }

  return (
    <ScreenFrame
      title="Upload documents"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth disabled={!allUploaded} loading={submitting} onClick={handleSubmit}>
          Submit for review
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {DOCS.map((doc) => {
          const existing = driver.documents.find((d) => d.docType === doc.id);
          return (
            <DocumentUploadCard
              key={doc.id}
              label={doc.label}
              status={uploading === doc.id ? 'pending' : existing ? 'uploaded' : 'empty'}
              fileName={existing?.fileName}
              onClick={() => handleUpload(doc.id)}
            />
          );
        })}
      </div>
    </ScreenFrame>
  );
}
