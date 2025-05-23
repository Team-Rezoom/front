import { useRef, useState } from 'react';
import { FaPlusCircle, FaCloudDownloadAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useMatch } from '../../context/MatchContext';
import fetchClient from '../../utils/fetchClient';
import UploadCheckModal from '../../modal/UploadCheckModal';
import LoadModal from '../../modal/LoadModal';
import { handleFileNotSelectedError, handleFileLoadError, handleListLoadingError, handleNoFileError } from './ErrorHandler';
import { validateFile } from './FileValidation';
import '../../styles/ContentApplicant.scss';
import '../../styles/ContentHR.scss';
import { HR_PAGE_STEPS } from '../Tutorial/HRTutorialSteps';
import { toast } from 'react-toastify';

const ContentHR = () => {
    const [fileState, setFileState] = useState({ name: '', file: null });
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef();
    const navigate = useNavigate();
    const { setJobPostFile } = useMatch();

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
            setFileState({ name: file.name, file });
            setIsUploadModalOpen(true);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (validateFile(file)) {
            setFileState({ name: file.name, file });
            setIsUploadModalOpen(true);
        }
    };

    const handleSubmit = async () => {
        if (!fileState.file) {
            handleNoFileError();
            setIsUploadModalOpen(false);
            return;
        }

        localStorage.setItem('jobPostFileUploaded', 'true');
        setJobPostFile(fileState.file);
        // List 페이지로 이동
        navigate('/list');
    };

    const fetchPostings = async () => {
        try {
            setIsLoading(true);
            const response = await fetchClient('/pdf/list');
            
            if (!response.ok) {
                handleListLoadingError(new Error('BAD REQUEST : ' + response.status));
                return;
            }

            const data = await response.json();
            setResumes(data.pdfs || []);
        } catch (error) {
            console.error('[CLIENT ERROR]', error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadConfirm = async () => {
        if (!selectedId) {
            handleFileNotSelectedError('채용공고');
            return;
        }
        const selectedResume = resumes.find(resume => resume.id === selectedId);
        if (selectedResume) {
            try {
                const response = await fetch(selectedResume.presignedUrl);
                if (!response.ok) {
                    handleFileLoadError(new Error('BAD REQUEST : ' + response.status));
                    const responseData = await response.json();
                    const error = new Error(responseData.message || "pdf 조회에 실패했습니다.");
                    reportError({
                        error,
                        url: selectedResume.presignedUrl
                    });
                    throw error;
                }
                const blob = await response.blob();
                const file = new File([blob], selectedResume.pdfFileName, { type: 'application/pdf' });
                setFileState({ 
                    name: selectedResume.pdfFileName, 
                    file: file 
                });
                // setIsLoadModalOpen(false);
                setIsUploadModalOpen(prev=>!prev);
            } catch (error) {
                handleFileLoadError(error);
                reportError({
                    error,
                    url: selectedResume.presignedUrl
                });
            }
        }
    };

    const handleLoadModalOpen = () => {
        setIsLoadModalOpen(true);
        fetchPostings();
    };

    const closeLoadModal = () => {setIsLoadModalOpen(false); setSelectedId(null);};
    const closeUploadCheckModal = () => setIsUploadModalOpen(prev=>!prev);

    return (
        <div className="l-content-hr">
            <section className="hero">
                <div className='inner'>
                    <div className="hero-content">
                        <h1 className="hero-title">
                            AI 매칭으로 인재 채용까지<br />
                            한 걸음 더
                        </h1>
                        <p className="hero-subtitle">
                            우리 회사에 맞는 인재를 정확히 추천해드려요.
                        </p>
                    </div>
                    <div className="hero-image">
                        <img 
                            src="/images/HR_MainContent_none.png" 
                            alt="AI 매칭 서비스" 
                            className="hero-img"
                        />
                    </div>
                </div>
            </section>
            <section className="service">
                <div className='inner'>
                    <div className="service-section">
                        <div className="upload-container">
                            <div
                                className="upload-area"
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <FaPlusCircle className="icon" />
                                <span className="upload-text">채용공고 매칭하기</span>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        
                            <button 
                                type="button"
                                onClick={handleLoadModalOpen}
                                className="button active"
                            >
                                <FaCloudDownloadAlt className="cloud-icon" />
                                <span>우리회사 공고<br/>불러오기</span>
                            </button>
                    
                        </div>
                        <p className="file-note">*등록가능한 파일 형식 및 확장자: PDF</p>
                    </div>
                </div>
            </section>
        

            {/* 채용공고 업로드 확인 모달 */}
            <UploadCheckModal isOpen={isUploadModalOpen} onRequestClose={closeUploadCheckModal} fileState={fileState} handleSubmit={handleSubmit} fileType={"공고"}/>            

            {/* 채용공고 불러오기 모달 */}
            <LoadModal isOpen={isLoadModalOpen} onRequestClose={closeLoadModal} isLoading={isLoading} resumes={resumes} selectedId={selectedId} setSelectedId={setSelectedId} handleLoadConfirm={handleLoadConfirm} fileType={"공고"}/>
        </div>
    );
}

export default ContentHR; 