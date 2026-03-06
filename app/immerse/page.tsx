"use client";

import React, { useState } from 'react';
import styles from './page.module.css';
import { Navbar, BottomNav, PageContainer } from "@/components/layout-components";

export default function ImmersePage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-brand-cream font-sans">
            <Navbar />
            <PageContainer>
                <div className={styles.container}>
                    <h1 className={styles.title}>Illusion Rooms Guide</h1>

                    {/* Room 1: Ultha Pultha */}
                    <div className={styles.instructionCarousel}>
                        <div className={styles.swipeHint}>Room 1: Ultha Pultha</div>
                        <div className={styles.carouselTrack}>

                            <div className={styles.carouselSlide}>
                                <div className={styles.slideContent}>
                                    <h2>1. Setup</h2>
                                    <p>Hold phone horizontally (Landscape).</p>
                                    <img src="/immerse/step-1.png" alt="Hold phone horizontally to capture the whole room" />
                                </div>
                            </div>

                            <div className={styles.carouselSlide}>
                                <div className={styles.slideContent}>
                                    <h2>2. Pose</h2>
                                    <p>Interact with the pillars or the "floor".</p>
                                    <img src="/immerse/step-2.png" alt="Examples of poses: clinging to pillars or reaching out" />
                                </div>
                            </div>

                            <div className={styles.carouselSlide}>
                                <div className={styles.slideContent}>
                                    <h2>3. Rotate</h2>
                                    <p>Rotate the final photo 90° to finish the illusion.</p>
                                    <img src="/immerse/step-3.png" alt="Rotate photo 90 degrees to make the wall look like the floor" />
                                </div>
                            </div>

                        </div>

                        <div className={styles.swipeHint}>&larr; Swipe for next step &rarr;</div>

                        <div className={styles.examplesSection}>
                            <h3 className={styles.examplesTitle}>Ideas & Samples</h3>
                            <div className={styles.thumbnailGallery}>
                                <img
                                    src="/immerse/ultha-pultha1.jpeg"
                                    alt="Ultha Pultha Example 1"
                                    className={styles.thumbnail}
                                    onClick={() => setSelectedImage("/immerse/ultha-pultha1.jpeg")}
                                />
                                <img
                                    src="/immerse/ultha-pultha2.jpeg"
                                    alt="Ultha Pultha Example 2"
                                    className={styles.thumbnail}
                                    onClick={() => setSelectedImage("/immerse/ultha-pultha2.jpeg")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room 2: Bade Miyan, Chote Miyan */}
                    <div className={styles.roomSection}>
                        <h2 className={styles.roomTitle}>Room 2: Bade Miyan, Chote Miyan</h2>
                        <p className={styles.comingSoon}>Guide coming soon...</p>
                        <div className={styles.examplesSection}>
                            <h3 className={styles.examplesTitle}>Sample Gallery</h3>
                            <div className={styles.thumbnailGallery}>
                                <img
                                    src="/immerse/bade1.jpg"
                                    alt="Bade Miyan, Chote Miyan Example"
                                    className={styles.thumbnail}
                                    onClick={() => setSelectedImage("/immerse/bade1.jpg")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Room 3: Khaas Daawat */}
                    <div className={styles.roomSection}>
                        <h2 className={styles.roomTitle}>Room 3: Khaas Daawat</h2>
                        <p className={styles.comingSoon}>Guide coming soon...</p>
                        <div className={styles.examplesSection}>
                            <h3 className={styles.examplesTitle}>Sample Gallery</h3>
                            <div className={styles.thumbnailGallery}>
                                <img
                                    src="/immerse/khaas1.jpg"
                                    alt="Khaas Daawat Example"
                                    className={styles.thumbnail}
                                    onClick={() => setSelectedImage("/immerse/khaas1.jpg")}
                                />
                            </div>
                        </div>
                    </div>

                    {selectedImage && (
                        <div className={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
                            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                                <button className={styles.closeButton} onClick={() => setSelectedImage(null)}>&times;</button>
                                <img src={selectedImage} alt="Enlarged view" className={styles.enlargedImage} />
                            </div>
                        </div>
                    )}

                </div>
            </PageContainer>
            <BottomNav />
        </div>
    );
}
