"use client";

import { useEffect, useRef } from "react";

export function InstagramEmbed({ url }: { url: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Load the Instagram embed script
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);

        // Re-process embeds when the script loads
        script.onload = () => {
            if ((window as any).instgrm) {
                (window as any).instgrm.Embeds.process();
            }
        };

        return () => {
            // Cleanup: remove the script if the component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="instagram-embed-wrapper overflow-hidden rounded-2xl">
            <blockquote
                className="instagram-media"
                data-instgrm-permalink={url}
                data-instgrm-version="14"
                style={{
                    background: "#FFF",
                    border: 0,
                    borderRadius: "16px",
                    margin: "0 auto",
                    maxWidth: "100%",
                    minWidth: "100%",
                    padding: 0,
                    width: "100%",
                }}
            />
        </div>
    );
}
