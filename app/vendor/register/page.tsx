'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer, Navbar } from '@/components/layout-components';
import { IslamicBorder, CharminarIcon } from '@/components/brand-elements';
import { VendorOtpStep } from '@/components/vendor/otp-step';
import {
    CATEGORIES,
    FOOD_CATEGORIES,
    CITIES,
    PRICE_RANGES,
    STALL_SIZES,
    FOOD_NOTICE,
    CONSENT_TEXT,
    type ApplicationType,
    type DocType,
} from '@/lib/vendor-constants';

type Step = 'PHONE' | 'OTP' | 'DETAILS' | 'STALL' | 'IMAGES' | 'REVIEW' | 'SUCCESS';

type UploadedImage = { key: string; name: string; previewUrl: string; docType: DocType };

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export default function VendorRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('PHONE');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [viaWhatsApp, setViaWhatsApp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Track
    const [applicationType, setApplicationType] = useState<ApplicationType>('FASHION');

    // Basic details
    const [businessName, setBusinessName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [email, setEmail] = useState('');
    const [city, setCity] = useState('');
    const [instagram, setInstagram] = useState('');
    const [website, setWebsite] = useState('');

    // Brand information
    const [productCategory, setProductCategory] = useState('');
    const [categoryOther, setCategoryOther] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [productsShowcasing, setProductsShowcasing] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [participatedBefore, setParticipatedBefore] = useState(false);
    const [exhibitionNames, setExhibitionNames] = useState('');

    // Stall requirements
    const [stallSize, setStallSize] = useState('');
    const [electricity, setElectricity] = useState(false);
    const [lightsCount, setLightsCount] = useState('');
    const [additionalRequirements, setAdditionalRequirements] = useState('');

    // Uploads + consent
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [consent, setConsent] = useState(false);
    const [applicationId, setApplicationId] = useState('');

    const categoryOptions = applicationType === 'FOOD' ? FOOD_CATEGORIES : CATEGORIES;
    const isOtherCategory = productCategory === 'Other (Please specify)';

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: `+91${phone}`, mode: 'register' }),
            });
            const data = await res.json();
            if (res.ok) {
                setViaWhatsApp(!!data.viaWhatsApp);
                setStep('OTP');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtpValue = async (otpValue: string) => {
        const res = await fetch('/api/vendor/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: `+91${phone}`, otp: otpValue }),
        });
        const data = await res.json();
        if (res.ok) {
            if (data.hasApplication) {
                router.push('/vendor/dashboard');
            } else {
                setStep('DETAILS');
            }
        } else {
            setError(data.error || 'Invalid OTP');
        }
        return res.ok;
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtpValue(otp);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDetailsNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!businessName.trim() || !contactPerson.trim() || !city || !productCategory) {
            setError('Please fill in all required fields.');
            return;
        }
        if (isOtherCategory && !categoryOther.trim()) {
            setError('Please specify your category.');
            return;
        }
        const words = countWords(brandDescription);
        if (words > 0 && (words < 50 || words > 100)) {
            setError('Brand description should be between 50 and 100 words.');
            return;
        }
        setStep('STALL');
    };

    const handleStallNext = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!stallSize) {
            setError('Please select a preferred stall size.');
            return;
        }
        setStep('IMAGES');
    };

    const handleFileUpload = async (file: File, docType: DocType) => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: file.name, contentType: file.type }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Upload failed');
                return;
            }
            await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
            setImages((prev) => [...prev, { key: data.key, name: file.name, previewUrl: URL.createObjectURL(file), docType }]);
        } catch {
            setError('Network error uploading file.');
        } finally {
            setLoading(false);
        }
    };

    const handleMultiUpload = async (files: FileList | null, docType: DocType) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            await handleFileUpload(file, docType);
        }
    };

    const removeImage = (key: string) => setImages((prev) => prev.filter((img) => img.key !== key));

    const imagesOf = (docType: DocType) => images.filter((img) => img.docType === docType);

    const handleImagesNext = () => {
        setError('');
        const productCount = imagesOf('product').length;
        if (productCount > 0 && (productCount < 5 || productCount > 10)) {
            setError('Please upload between 5 and 10 product photographs.');
            return;
        }
        setStep('REVIEW');
    };

    const handleSubmit = async () => {
        setError('');
        if (!consent) {
            setError('Please tick the acknowledgement to continue.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/vendor/application', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationType,
                    businessName,
                    contactPerson,
                    whatsappNumber,
                    email,
                    city,
                    instagram,
                    website,
                    productCategory,
                    categoryOther: isOtherCategory ? categoryOther : null,
                    brandDescription,
                    productsShowcasing,
                    priceRange,
                    participatedBefore,
                    exhibitionNames: participatedBefore ? exhibitionNames : null,
                    stallSize,
                    electricity,
                    lightsCount: electricity ? lightsCount : null,
                    additionalRequirements,
                    consent,
                    images: images.map(({ key, name, docType }) => ({ key, name, docType })),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setApplicationId(data.vendorId);
                setStep('SUCCESS');
            } else {
                setError(data.error || 'Failed to submit application');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const descWords = countWords(brandDescription);

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <PageContainer>
                <div className="text-center mb-6">
                    <CharminarIcon className="w-12 h-12 text-brand-blue mx-auto mb-2 opacity-80" />
                    <h1 className="font-herb text-3xl text-brand-red">Vendor Registration</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">Daawat-e-Ramzaan • Season 6 • 2027</p>
                </div>
                <IslamicBorder className="mb-6" />

                {step === 'PHONE' && (
                    <VendorOtpStep
                        phase="PHONE"
                        phone={phone}
                        otp={otp}
                        loading={loading}
                        error={error}
                        viaWhatsApp={viaWhatsApp}
                        onPhoneChange={setPhone}
                        onOtpChange={setOtp}
                        onSendOtp={handleSendOtp}
                        onVerifyOtp={handleVerifyOtp}
                    />
                )}

                {step === 'OTP' && (
                    <VendorOtpStep
                        phase="OTP"
                        phone={phone}
                        otp={otp}
                        loading={loading}
                        error={error}
                        viaWhatsApp={viaWhatsApp}
                        onPhoneChange={setPhone}
                        onOtpChange={setOtp}
                        onSendOtp={handleSendOtp}
                        onVerifyOtp={handleVerifyOtp}
                    />
                )}

                {step === 'DETAILS' && (
                    <form onSubmit={handleDetailsNext} className="flex flex-col gap-4">
                        {error && <ErrorBox>{error}</ErrorBox>}

                        {/* Track selector */}
                        <div className="grid grid-cols-2 gap-2">
                            {(['FASHION', 'FOOD'] as ApplicationType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => { setApplicationType(t); setProductCategory(''); }}
                                    className={`p-3 rounded-xl text-sm font-bold border transition-colors ${applicationType === t ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-gray-500 border-brand-red/10'}`}
                                >
                                    {t === 'FASHION' ? 'Fashion & Lifestyle' : 'Food Court'}
                                </button>
                            ))}
                        </div>

                        {applicationType === 'FOOD' && (
                            <div className="bg-brand-red/5 border border-brand-red/20 text-gray-600 p-3 rounded-xl text-xs leading-relaxed">
                                {FOOD_NOTICE}
                            </div>
                        )}

                        <SectionTitle>Basic Details</SectionTitle>
                        <Field label="Brand Name *">
                            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="input" />
                        </Field>
                        <Field label="Contact Person *">
                            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="input" />
                        </Field>
                        <Field label="Mobile Number">
                            <input value={`+91 ${phone}`} disabled className="input opacity-60" />
                        </Field>
                        <Field label="WhatsApp Number">
                            <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="input" placeholder="If different from mobile" />
                        </Field>
                        <Field label="Email Address">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                        </Field>
                        <Field label="City *">
                            <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                                <option value="">Select city</option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </Field>
                        <Field label="Instagram Handle">
                            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="input" placeholder="@yourbrand" />
                        </Field>
                        <Field label="Website (Optional)">
                            <input value={website} onChange={(e) => setWebsite(e.target.value)} className="input" />
                        </Field>

                        <SectionTitle>Brand Information</SectionTitle>
                        <Field label="Product Category *">
                            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="input">
                                <option value="">Select category</option>
                                {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </Field>
                        {isOtherCategory && (
                            <Field label="Please specify *">
                                <input value={categoryOther} onChange={(e) => setCategoryOther(e.target.value)} className="input" />
                            </Field>
                        )}
                        <Field label="Briefly tell us about your brand (50–100 words)">
                            <textarea value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} className="input min-h-24" />
                            <span className={`text-xs mt-1 ${descWords > 0 && (descWords < 50 || descWords > 100) ? 'text-brand-red' : 'text-gray-400'}`}>{descWords} words</span>
                        </Field>
                        <Field label="What products will you be showcasing?">
                            <textarea value={productsShowcasing} onChange={(e) => setProductsShowcasing(e.target.value)} className="input min-h-20" />
                        </Field>
                        <Field label="Average Price Range">
                            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="input">
                                <option value="">Select price range</option>
                                {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </Field>
                        <Field label="Have you participated in exhibitions before?">
                            <div className="grid grid-cols-2 gap-2">
                                {[true, false].map((val) => (
                                    <button
                                        key={String(val)}
                                        type="button"
                                        onClick={() => setParticipatedBefore(val)}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-colors ${participatedBefore === val ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-brand-blue/10'}`}
                                    >
                                        {val ? 'Yes' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        {participatedBefore && (
                            <Field label="Please mention the exhibition names">
                                <textarea value={exhibitionNames} onChange={(e) => setExhibitionNames(e.target.value)} className="input min-h-20" />
                            </Field>
                        )}

                        <button type="submit" className="btn-primary">Next</button>
                    </form>
                )}

                {step === 'STALL' && (
                    <form onSubmit={handleStallNext} className="flex flex-col gap-4">
                        {error && <ErrorBox>{error}</ErrorBox>}
                        <SectionTitle>Stall Requirements</SectionTitle>
                        <Field label="Preferred Stall Size *">
                            <div className="grid grid-cols-2 gap-2">
                                {STALL_SIZES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStallSize(s)}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-colors ${stallSize === s ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-brand-blue/10'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="Do you require electricity?">
                            <div className="grid grid-cols-2 gap-2">
                                {[true, false].map((val) => (
                                    <button
                                        key={String(val)}
                                        type="button"
                                        onClick={() => setElectricity(val)}
                                        className={`p-3 rounded-xl text-sm font-bold border transition-colors ${electricity === val ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-500 border-brand-blue/10'}`}
                                    >
                                        {val ? 'Yes' : 'No'}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        {electricity && (
                            <Field label="How many lights will you require?">
                                <input type="number" min="0" value={lightsCount} onChange={(e) => setLightsCount(e.target.value)} className="input" />
                                <span className="text-xs text-gray-400 mt-1 leading-relaxed">
                                    6&apos; × 6&apos; stalls include 2 complimentary lights; 8&apos; × 6&apos; and above include 3. Additional lights are charged separately.
                                </span>
                            </Field>
                        )}
                        <Field label="Additional electrical or setup requirements (Optional)">
                            <textarea value={additionalRequirements} onChange={(e) => setAdditionalRequirements(e.target.value)} className="input min-h-20" />
                        </Field>
                        <button type="submit" className="btn-primary">Next</button>
                    </form>
                )}

                {step === 'IMAGES' && (
                    <div className="flex flex-col gap-5">
                        {error && <ErrorBox>{error}</ErrorBox>}
                        <SectionTitle>Uploads</SectionTitle>

                        <UploadGroup
                            label="Brand Logo"
                            hint="Upload your brand logo"
                            multiple={false}
                            loading={loading}
                            images={imagesOf('logo')}
                            onSelect={(files) => handleMultiUpload(files, 'logo')}
                            onRemove={removeImage}
                        />
                        <UploadGroup
                            label="Product Photographs (5–10)"
                            hint="Upload 5 to 10 product photos"
                            multiple
                            loading={loading}
                            images={imagesOf('product')}
                            onSelect={(files) => handleMultiUpload(files, 'product')}
                            onRemove={removeImage}
                        />
                        <UploadGroup
                            label="Government ID Proof"
                            hint="Aadhaar / PAN / Passport / Driving Licence of the applicant"
                            multiple={false}
                            loading={loading}
                            images={imagesOf('id')}
                            onSelect={(files) => handleMultiUpload(files, 'id')}
                            onRemove={removeImage}
                        />

                        <button type="button" onClick={handleImagesNext} disabled={loading} className="btn-primary mt-2">
                            {loading ? 'Uploading...' : 'Next'}
                        </button>
                    </div>
                )}

                {step === 'REVIEW' && (
                    <div className="flex flex-col gap-4">
                        {error && <ErrorBox>{error}</ErrorBox>}
                        <div className="bg-white rounded-2xl p-5 border border-brand-blue/10 text-sm space-y-2">
                            <p><strong>Track:</strong> {applicationType === 'FOOD' ? 'Food Court' : 'Fashion & Lifestyle'}</p>
                            <p><strong>Brand:</strong> {businessName}</p>
                            <p><strong>Contact:</strong> {contactPerson}</p>
                            <p><strong>Mobile:</strong> +91 {phone}</p>
                            {whatsappNumber && <p><strong>WhatsApp:</strong> {whatsappNumber}</p>}
                            {email && <p><strong>Email:</strong> {email}</p>}
                            <p><strong>City:</strong> {city}</p>
                            {instagram && <p><strong>Instagram:</strong> {instagram}</p>}
                            {website && <p><strong>Website:</strong> {website}</p>}
                            <p><strong>Category:</strong> {isOtherCategory ? categoryOther : productCategory}</p>
                            {priceRange && <p><strong>Price Range:</strong> {priceRange}</p>}
                            <p><strong>Exhibited before:</strong> {participatedBefore ? `Yes${exhibitionNames ? ` — ${exhibitionNames}` : ''}` : 'No'}</p>
                            <p><strong>Stall Size:</strong> {stallSize}</p>
                            <p><strong>Electricity:</strong> {electricity ? `Yes${lightsCount ? ` — ${lightsCount} lights` : ''}` : 'No'}</p>
                            <p><strong>Uploads:</strong> {imagesOf('logo').length} logo, {imagesOf('product').length} product, {imagesOf('id').length} ID</p>
                        </div>

                        <label className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-brand-blue/10 cursor-pointer">
                            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 w-5 h-5 accent-brand-red shrink-0" />
                            <span className="text-xs text-gray-600 leading-relaxed">{CONSENT_TEXT}</span>
                        </label>

                        <button onClick={handleSubmit} disabled={loading || !consent} className="btn-primary">
                            {loading ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="flex flex-col items-center text-center gap-6 py-8">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-blue">Application Received!</h2>
                        <p className="text-gray-500 text-sm px-4">
                            Thank you for applying to Daawat-e-Ramzaan Season 6. Submission does not guarantee participation — our team reviews every application and will contact shortlisted brands.
                        </p>
                        <p className="text-xs text-gray-400">Application ID: {applicationId}</p>
                        <Link href="/vendor/dashboard" className="btn-primary inline-block">Go to Dashboard</Link>
                    </div>
                )}
            </PageContainer>

            <style jsx global>{`
                .input {
                    width: 100%;
                    background: white;
                    border: 1px solid rgba(43, 94, 167, 0.1);
                    border-radius: 1rem;
                    padding: 0.875rem 1rem;
                    font-size: 0.95rem;
                }
                .btn-primary {
                    width: 100%;
                    padding: 1rem;
                    background: #2b5ea7;
                    color: white;
                    border-radius: 1rem;
                    font-weight: 700;
                    text-align: center;
                    transition: opacity 0.2s;
                }
                .btn-primary:disabled { opacity: 0.5; }
            `}</style>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">{label}</span>
            {children}
        </label>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-bold text-brand-red mt-2 border-b border-brand-red/10 pb-1">{children}</h2>;
}

function ErrorBox({ children }: { children: React.ReactNode }) {
    return <div className="bg-brand-red/10 border border-brand-red/30 text-brand-red p-3 rounded-xl text-center text-sm">{children}</div>;
}

function UploadGroup({
    label,
    hint,
    multiple,
    loading,
    images,
    onSelect,
    onRemove,
}: {
    label: string;
    hint: string;
    multiple: boolean;
    loading: boolean;
    images: { key: string; name: string; previewUrl: string }[];
    onSelect: (files: FileList | null) => void;
    onRemove: (key: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-brand-blue">{label}</label>
            <p className="text-xs text-gray-400 -mt-1">{hint}</p>
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple={multiple}
                onChange={(e) => { onSelect(e.target.files); e.target.value = ''; }}
                disabled={loading}
                className="text-sm text-gray-500 file:mr-3 file:py-3 file:px-5 file:rounded-xl file:border-0 file:font-bold file:text-sm file:bg-brand-blue file:text-white hover:file:bg-brand-blue/90 file:cursor-pointer disabled:opacity-50"
            />
            {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                        <div key={img.key} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                            <img src={img.previewUrl} alt={img.name} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onRemove(img.key)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:opacity-100"
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
