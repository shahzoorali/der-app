"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/vendor/status-badge";
import { CATEGORIES, CITY_OPTIONS, CITIES, PRICE_RANGES, STALL_SIZES } from "@/lib/vendor-constants";
import { useAdminAuth } from "@/lib/use-admin-auth";

const STATUSES = ["SUBMITTED", "APPROVED", "WAITLISTED", "REJECTED", "INFO_REQUIRED", "PAID"];

export default function VendorDetailAdminPage() {
    const params = useParams();
    const router = useRouter();
    const phone = decodeURIComponent(params.phone as string);

    const { password, setPassword, isAuthenticated, loginError, handleLogin, ready } = useAdminAuth();

    const [deleting, setDeleting] = useState(false);

    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [actionResult, setActionResult] = useState("");

    const [status, setStatus] = useState("SUBMITTED");
    const [note, setNote] = useState("");

    // Multiple stall allotments (vendor may be in more than one city)
    type StallRow = { city: string; stallNumber: string; size: string; notes: string };
    const [stalls, setStalls] = useState<StallRow[]>([]);

    const [amount, setAmount] = useState("");

    // Editable application details
    const [appType, setAppType] = useState("FASHION");
    const [appCity, setAppCity] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [instagram, setInstagram] = useState("");
    const [website, setWebsite] = useState("");
    const [categoryOther, setCategoryOther] = useState("");
    const [productsShowcasing, setProductsShowcasing] = useState("");
    const [priceRange, setPriceRange] = useState("");
    const [participatedBefore, setParticipatedBefore] = useState(false);
    const [exhibitionNames, setExhibitionNames] = useState("");
    const [appStallSize, setAppStallSize] = useState("");
    const [electricity, setElectricity] = useState(false);
    const [lightsCount, setLightsCount] = useState("");
    const [additionalRequirements, setAdditionalRequirements] = useState("");

    // Editable submitted details
    const [businessName, setBusinessName] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [email, setEmail] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [cityPreferences, setCityPreferences] = useState<string[]>([]);
    const [brandDescription, setBrandDescription] = useState("");

    // Editable documents
    const [images, setImages] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) fetchVendor();
    }, [isAuthenticated]);

    const fetchVendor = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}`, {
                headers: { "Authorization": `Bearer ${password}` }
            });
            const data = await res.json();
            if (res.ok) {
                setVendor(data);
                setStatus(data.status);
                setNote(data.statusNote || "");
                setBusinessName(data.businessName || "");
                setContactPerson(data.contactPerson || "");
                setEmail(data.email || "");
                setProductCategory(data.productCategory || "");
                setCityPreferences(data.cityPreferences || []);
                setBrandDescription(data.brandDescription || "");
                setImages(data.images || []);

                // Application details
                setAppType(data.applicationType || "FASHION");
                setAppCity(data.city || "");
                setWhatsappNumber(data.whatsappNumber || "");
                setInstagram(data.instagram || "");
                setWebsite(data.website || "");
                setCategoryOther(data.categoryOther || "");
                setProductsShowcasing(data.productsShowcasing || "");
                setPriceRange(data.priceRange || "");
                setParticipatedBefore(!!data.participatedBefore);
                setExhibitionNames(data.exhibitionNames || "");
                setAppStallSize(data.stallSize || "");
                setElectricity(!!data.electricity);
                setLightsCount(data.lightsCount != null ? String(data.lightsCount) : "");
                setAdditionalRequirements(data.additionalRequirements || "");

                // Stalls — prefer the array, fall back to legacy single `stall`.
                const existingStalls = Array.isArray(data.stalls) && data.stalls.length > 0
                    ? data.stalls
                    : data.stall ? [data.stall] : [];
                setStalls(existingStalls.map((s: any) => ({
                    city: s.city || "",
                    stallNumber: s.stallNumber || "",
                    size: s.size || "",
                    notes: s.notes || "",
                })));
            }
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const runAction = async (body: any) => {
        setActionResult("");
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${password}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (res.ok) {
                setActionResult("Saved successfully.");
                fetchVendor();
            } else {
                setActionResult(data.error || "Action failed.");
            }
        } catch (e) {
            setActionResult("Network error.");
        }
    };

    const toggleCity = (c: string) => {
        setCityPreferences((prev) => {
            if (c === "Any") return prev.includes("Any") ? [] : ["Any"];
            const withoutAny = prev.filter((x) => x !== "Any");
            return withoutAny.includes(c) ? withoutAny.filter((x) => x !== c) : [...withoutAny, c];
        });
    };

    const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setUploading(true);
        setActionResult("");
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}/upload-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${password}` },
                body: JSON.stringify({ fileName: file.name, contentType: file.type }),
            });
            const data = await res.json();
            if (!res.ok) {
                setActionResult(data.error || "Upload failed.");
                setUploading(false);
                return;
            }
            const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
            if (!put.ok) {
                setActionResult("Upload to storage failed.");
                setUploading(false);
                return;
            }
            const nextImages = [...images, { key: data.key, name: file.name }];
            await runAction({ action: "updateImages", images: nextImages });
        } catch (err) {
            setActionResult("Network error during upload.");
        }
        setUploading(false);
    };

    const handleRemoveImage = async (idx: number) => {
        if (!confirm("Remove this document?")) return;
        const nextImages = images.filter((_, i) => i !== idx);
        await runAction({ action: "updateImages", images: nextImages });
    };

    const addStall = () => setStalls((prev) => [...prev, { city: "", stallNumber: "", size: "", notes: "" }]);
    const removeStall = (idx: number) => setStalls((prev) => prev.filter((_, i) => i !== idx));
    const updateStall = (idx: number, field: keyof StallRow, value: string) =>
        setStalls((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));

    const saveStalls = () => {
        const valid = stalls.filter((s) => s.city.trim() && s.stallNumber.trim());
        runAction({ action: "assignStall", stalls: valid });
    };

    const handleDeleteVendor = async () => {
        const typed = window.prompt(
            `This permanently deletes ${vendor.businessName || "this vendor"} — their application, all uploaded files, and stall/payment records. This cannot be undone.\n\nType the vendor's phone (${vendor.phone}) to confirm:`
        );
        if (typed === null) return; // cancelled
        if (typed.trim() !== vendor.phone) {
            setActionResult("Phone did not match — deletion cancelled.");
            return;
        }
        setDeleting(true);
        setActionResult("");
        try {
            const res = await fetch(`/api/admin/vendors/${encodeURIComponent(phone)}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${password}` },
                body: JSON.stringify({ confirmPhone: vendor.phone }),
            });
            const data = await res.json();
            if (res.ok) {
                router.push("/admin/vendors");
            } else {
                setActionResult(data.error || "Delete failed.");
                setDeleting(false);
            }
        } catch (e) {
            setActionResult("Network error during delete.");
            setDeleting(false);
        }
    };

    const saveApplication = () => runAction({
        action: "editApplication",
        applicationType: appType,
        city: appCity,
        whatsappNumber,
        instagram,
        website,
        categoryOther,
        productsShowcasing,
        priceRange,
        participatedBefore,
        exhibitionNames,
        stallSize: appStallSize,
        electricity,
        lightsCount: lightsCount === "" ? null : lightsCount,
        additionalRequirements,
    });

    if (!ready) return null;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Vendors Login</h2>
                    <form className="mt-8 space-y-6 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className={`mt-1 block w-full border ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            />
                            {loginError && <p className="mt-1 text-xs text-red-600">Incorrect password. Please try again.</p>}
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading || !vendor) {
        return <div className="min-h-screen bg-gray-100 p-8 text-center text-gray-500">Loading vendor...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h1>
                        <p className="text-sm text-gray-500 font-mono">{vendor.phone}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <StatusBadge status={vendor.status} />
                        <a href="/admin/vendors" className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Back to List
                        </a>
                    </div>
                </div>

                {actionResult && (
                    <div className="bg-white rounded-md shadow p-3 text-sm text-gray-700">{actionResult}</div>
                )}

                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Submitted Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Field label="Business Name" value={businessName} onChange={setBusinessName} />
                        <Field label="Contact Person" value={contactPerson} onChange={setContactPerson} />
                        <Field label="Email" value={email} onChange={setEmail} />
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Category</label>
                            <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="">Select a category</option>
                                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase">City Preferences</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {CITY_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => toggleCity(c)}
                                        className={`px-3 py-1.5 rounded-md text-sm border ${cityPreferences.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase">Brand Description</label>
                            <textarea value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
                        </div>
                    </div>
                    <button
                        onClick={() => runAction({
                            action: 'editDetails',
                            businessName,
                            contactPerson,
                            email,
                            productCategory,
                            brandDescription,
                            cityPreferences,
                        })}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                        Save Details
                    </button>
                </div>

                {/* Full application (editable) */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Application Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Track</label>
                            <select value={appType} onChange={(e) => setAppType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="FASHION">Fashion & Lifestyle</option>
                                <option value="FOOD">Food Court</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">City</label>
                            <select value={appCity} onChange={(e) => setAppCity(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="">Select city</option>
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <Field label="WhatsApp" value={whatsappNumber} onChange={setWhatsappNumber} />
                        <Field label="Instagram" value={instagram} onChange={setInstagram} />
                        <Field label="Website" value={website} onChange={setWebsite} />
                        <Field label="Category (Other)" value={categoryOther} onChange={setCategoryOther} />
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase">Products Showcasing</label>
                            <textarea value={productsShowcasing} onChange={(e) => setProductsShowcasing(e.target.value)} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Price Range</label>
                            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="">—</option>
                                {PRICE_RANGES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Preferred Stall Size</label>
                            <select value={appStallSize} onChange={(e) => setAppStallSize(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="">—</option>
                                {STALL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Exhibited Before</label>
                            <select value={participatedBefore ? "yes" : "no"} onChange={(e) => setParticipatedBefore(e.target.value === "yes")} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
                        </div>
                        <Field label="Exhibition Names" value={exhibitionNames} onChange={setExhibitionNames} />
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase">Electricity</label>
                            <select value={electricity ? "yes" : "no"} onChange={(e) => setElectricity(e.target.value === "yes")} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                            </select>
                        </div>
                        <Field label="Lights Count" value={lightsCount} onChange={setLightsCount} />
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-400 uppercase">Additional Requirements</label>
                            <textarea value={additionalRequirements} onChange={(e) => setAdditionalRequirements(e.target.value)} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <button onClick={saveApplication} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                            Save Application Details
                        </button>
                        <span className="text-xs text-gray-400">Acknowledgement: {vendor.consent ? 'Accepted' : 'Not accepted'}</span>
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Documents</h3>
                        <label className={`px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer ${uploading ? 'bg-gray-300 text-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                            {uploading ? 'Uploading…' : '+ Add Document'}
                            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" disabled={uploading} onChange={handleAddImage} />
                        </label>
                    </div>
                    {vendor.images?.length > 0 ? (
                        <div className="grid grid-cols-4 gap-3">
                            {vendor.images.map((img: any, i: number) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                    </a>
                                    <button
                                        onClick={() => handleRemoveImage(i)}
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-90 hover:opacity-100"
                                        title="Remove document"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No documents uploaded.</p>
                    )}
                </div>

                {/* Status update */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Update Status</h3>
                    <div className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="w-full md:w-56">
                            <label className="block text-xs font-medium text-gray-500">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="flex-grow w-full">
                            <label className="block text-xs font-medium text-gray-500">Note (shown to vendor, e.g. what info is needed)</label>
                            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
                        </div>
                        <button onClick={() => runAction({ action: 'setStatus', status, note })} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                            Save Status
                        </button>
                    </div>
                </div>

                {/* Stall assignment (supports multiple cities) */}
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">Stall Allotment</h3>
                        <button onClick={addStall} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50">+ Add City / Stall</button>
                    </div>
                    {stalls.length === 0 ? (
                        <p className="text-sm text-gray-500 mb-3">No stalls allotted yet. Add one or more.</p>
                    ) : (
                        <div className="space-y-3">
                            {stalls.map((s, i) => (
                                <div key={i} className="grid grid-cols-2 md:grid-cols-9 gap-3 items-center">
                                    <input placeholder="City" value={s.city} onChange={(e) => updateStall(i, "city", e.target.value)} className="md:col-span-2 border border-gray-300 rounded-md py-2 px-3" />
                                    <input placeholder="Stall Number" value={s.stallNumber} onChange={(e) => updateStall(i, "stallNumber", e.target.value)} className="md:col-span-2 border border-gray-300 rounded-md py-2 px-3" />
                                    <input placeholder="Size (optional)" value={s.size} onChange={(e) => updateStall(i, "size", e.target.value)} className="md:col-span-2 border border-gray-300 rounded-md py-2 px-3" />
                                    <input placeholder="Notes (optional)" value={s.notes} onChange={(e) => updateStall(i, "notes", e.target.value)} className="md:col-span-2 border border-gray-300 rounded-md py-2 px-3" />
                                    <button onClick={() => removeStall(i)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={saveStalls} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                        Save Stall Allotment
                    </button>
                </div>

                {/* Agreement */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Agreement</h3>
                    {vendor.agreement?.accepted ? (
                        <p className="text-sm text-green-700">Accepted by {vendor.agreement.name} on {new Date(vendor.agreement.acceptedAt).toLocaleString()}</p>
                    ) : (
                        <p className="text-sm text-gray-500">Not yet accepted.</p>
                    )}
                </div>

                {/* Payment */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Payment</h3>
                    {vendor.payment ? (
                        <div className="text-sm text-gray-700 space-y-1 mb-3">
                            <p>Amount: ₹{vendor.payment.amount?.toLocaleString('en-IN')}</p>
                            <p>Status: {vendor.payment.status}</p>
                            {vendor.payment.shortUrl && <p>Link: <a href={vendor.payment.shortUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600">{vendor.payment.shortUrl}</a></p>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-3">No payment link created yet.</p>
                    )}
                    <div className="flex gap-3 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-500">Amount (INR)</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block border border-gray-300 rounded-md py-2 px-3 w-40" />
                        </div>
                        <button onClick={() => runAction({ action: 'createPaymentLink', amount: parseFloat(amount) })} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                            Create Payment Link
                        </button>
                    </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white shadow rounded-lg p-6 border border-red-200">
                    <h3 className="text-sm font-bold text-red-700 mb-1">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-3">
                        Permanently delete this vendor — application, uploaded files, stall and payment records. This cannot be undone.
                    </p>
                    <button
                        onClick={handleDeleteVendor}
                        disabled={deleting}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                        {deleting ? "Deleting…" : "Delete Vendor"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
    return (
        <div className={full ? "md:col-span-2" : ""}>
            <label className="block text-xs font-medium text-gray-400 uppercase">{label}</label>
            <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
        </div>
    );
}
