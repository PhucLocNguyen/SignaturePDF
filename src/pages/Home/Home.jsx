import { useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import SignaturePad from "react-signature-canvas";
// Text layer for React-PDF.
import "react-pdf/dist/Page/TextLayer.css";
import { PDFDocument } from "pdf-lib";
// Importing the PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
import "./style.css";
const Home = () => {
  const signatureRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfUrl, setPdfUrl] = useState("");
  const [signatureData, setSignatureData] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null); // PDF as ArrayBuffer
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const pdfContainerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };
  const savePDFWithSignature = async () => {
    if (!pdfBytes || !signatureData) {
      alert("Please upload a PDF and create a signature first!");
      return;
    }

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureData);
    const signatureDims = signatureImage.scale(0.5);

    const page = pdfDoc.getPage(pageNumber - 1);
    const { width, height } = page.getSize();

    // Tính tỷ lệ giữa container và PDF thực
    const containerWidth = pdfContainerRef.current.offsetWidth;
    const containerHeight = pdfContainerRef.current.offsetHeight;

    const scaleX = width / containerWidth;
    const scaleY = height / containerHeight;

    // Tính toán vị trí chính xác trên PDF
    const pdfX = position.x * scaleX;
    const pdfY = height - position.y * scaleY - signatureDims.height;

    page.drawImage(signatureImage, {
      x: pdfX,
      y: pdfY,
      width: signatureDims.width,
      height: signatureDims.height,
    });

    const pdfBytesSigned = await pdfDoc.save();
    const blob = new Blob([pdfBytesSigned], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "signed-document.pdf";
    link.click();

    URL.revokeObjectURL(url);
  };

  const goToPrevPage = () =>
    setPageNumber(pageNumber - 1 <= 1 ? 1 : pageNumber - 1);

  const goToNextPage = () =>
    setPageNumber(pageNumber + 1 >= numPages ? numPages : pageNumber + 1);
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      const fileBytes = await file.arrayBuffer();
      setPdfBytes(fileBytes);
      setPdfUrl(URL.createObjectURL(file)); // Temporary URL for Viewer
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleSaveSignature = () => {
    const dataURL = signatureRef.current
      .getTrimmedCanvas()
      .toDataURL("image/png");
    setSignatureData(dataURL);
  };

  const handleClearSignature = () => {
    signatureRef.current.clear();
    setSignatureData(null);
  };
  const handleDragStart = (e) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ offsetX: e.clientX, offsetY: e.clientY })
    );
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (!pdfContainerRef.current) return;

    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const newLeft = e.clientX - containerRect.left;
    const newTop = e.clientY - containerRect.top;

    setPosition({ x: newLeft, y: newTop });
  };
  return (
    <div className="page">
      <div className="grid grid-cols-3 w-full">
        <div className="col-span-1">
          <h1>Ký và Tải PDF</h1>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <SignaturePad
            ref={signatureRef}
            canvasProps={{
              width: 300,
              height: 100,
              style: { border: "1px solid black", marginBottom: "10px" },
            }}
          />
          <button onClick={handleSaveSignature}>Lưu chữ ký</button>
          <button onClick={handleClearSignature}>Xóa chữ ký</button>
          <button onClick={savePDFWithSignature}>Tải PDF đã ký</button>
        </div>
        <div className="col-span-2">
          <nav>
            <button onClick={goToPrevPage} className="previous">
              Prev
            </button>
            <button onClick={goToNextPage} className="next">
              Next
            </button>
            <p>
              Page {pageNumber} of {numPages}
            </p>
          </nav>
          <div
            ref={pdfContainerRef}
            style={{
              width: "100%",
              height: "90vh",
              position: "relative",
              backgroundColor: "#f0f0f0",
            }}
          >
            {pdfUrl && (
              <Document
                file={pdfUrl}
                className="relative h-screen w-full bg-[#f0f0f0]"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page pageNumber={pageNumber} />
                {signatureData && (
                  <div>
                    <img
                      src={signatureData}
                      alt="Signature"
                      draggable
                      onDragStart={handleDragStart}
                      style={{
                        position: "absolute",
                        top: position.y,
                        left: position.x,
                        width: 100,
                        cursor: "grab",
                        zIndex: 10,
                      }}
                    />
                  </div>
                )}
              </Document>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
