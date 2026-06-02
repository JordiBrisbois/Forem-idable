import { NextRequest, NextResponse } from "next/server";
import { isValidForemOfferId } from "@/lib/forem";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;

        if (!id) {
            return new NextResponse("Missing job ID", { status: 400 });
        }

        if (!isValidForemOfferId(id)) {
            return new NextResponse("Invalid job ID", { status: 400 });
        }

        const candidateUrls = [
            `https://www.leforem.be/recherche-offres/api/Document/PDF/${id}`,
            `https://www.leforem.be/recherche-offres/api/offre-detail/${id}/pdf`,
        ];

        for (const foremApiUrl of candidateUrls) {
            const response = await fetch(foremApiUrl, {
                method: "GET",
                headers: {
                    Accept: "application/pdf,application/octet-stream,*/*",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    Referer: "https://www.leforem.be/recherche-offres/offres",
                },
            });

            if (!response.ok) {
                continue;
            }

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.toLowerCase().includes("pdf")) {
                continue;
            }

            const arrayBuffer = await response.arrayBuffer();

            return new NextResponse(arrayBuffer, {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `inline; filename="Offre_Forem_${id}.pdf"`,
                    "Cache-Control": "public, max-age=3600",
                },
            });
        }

        return new NextResponse("PDF not found or unavailable on Forem servers", { status: 404 });

    } catch (error) {
        console.error("Error bypassing Forem PDF blob API:", error);
        return new NextResponse("Internal proxy server error", { status: 500 });
    }
}
