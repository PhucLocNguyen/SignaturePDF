import { useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import SignaturePad from "react-signature-canvas";

// Cấu hình worker của PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const SignaturePage = () => {
  const pdfContainerRef = useRef(null);
  const signaturePadRef = useRef(null);

  // State quản lý PDF
  const [pdfUrl, setPdfUrl] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(null);

  // State quản lý các vùng chữ ký
  const [signatureAreas, setSignatureAreas] = useState([]);
  const [currentSignature, setCurrentSignature] = useState(null); // Chữ ký hiện tại

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfUrl(URL.createObjectURL(file)); // Temporary URL for PDF Viewer
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // Xử lý double click để tạo vùng ký
  const handleDoubleClick = (e) => {
    if (!pdfContainerRef.current) return;

    const containerRect = pdfContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - containerRect.left;
    const clickY = e.clientY - containerRect.top;

    const newArea = {
      id: Date.now().toString(), // ID duy nhất
      top: clickY,
      left: clickX,
      width: 150, // Kích thước mặc định
      height: 50, // Kích thước mặc định
    };

    setSignatureAreas((prevAreas) => [...prevAreas, newArea]);
  };

  // Kéo vùng ký
  const handleDrag = (e, id) => {
    const containerRect = pdfContainerRef.current.getBoundingClientRect();

    const newLeft = e.clientX - containerRect.left;
    const newTop = e.clientY - containerRect.top;

    setSignatureAreas((prevAreas) =>
      prevAreas.map((area) =>
        area.id === id
          ? {
              ...area,
              left: Math.max(0, Math.min(containerRect.width - area.width, newLeft)),
              top: Math.max(0, Math.min(containerRect.height - area.height, newTop)),
            }
          : area
      )
    );
  };

  // Thay đổi kích thước vùng ký
  const handleResize = (e, id) => {
    const containerRect = pdfContainerRef.current.getBoundingClientRect();

    const newWidth = e.clientX - containerRect.left;
    const newHeight = e.clientY - containerRect.top;

    setSignatureAreas((prevAreas) =>
      prevAreas.map((area) =>
        area.id === id
          ? {
              ...area,
              width: Math.max(50, newWidth - area.left), // Chiều rộng tối thiểu
              height: Math.max(30, newHeight - area.top), // Chiều cao tối thiểu
            }
          : area
      )
    );
  };

  // Lưu chữ ký từ SignaturePad
  const handleSaveSignature = () => {
    const dataURL = signaturePadRef.current.getTrimmedCanvas().toDataURL("image/png");
    setCurrentSignature(dataURL); // Lưu chữ ký hiện tại
  };

  // Chèn chữ ký vào vùng
  const applySignature = (id) => {
    setSignatureAreas((prevAreas) =>
      prevAreas.map((area) =>
        area.id === id ? { ...area, signature: currentSignature } : area
      )
    );
  };

  // Xóa chữ ký
  const handleClearSignature = () => {
    signaturePadRef.current.clear();
    setCurrentSignature(null);
  };

  return (
    <div className="page">
      <h1>Ký PDF - Vùng động</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <div
          ref={pdfContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: "80vh",
            border: "1px solid #ccc",
            overflow: "auto",
            background: "#f5f5f5",
          }}
          onDoubleClick={handleDoubleClick}
        >
          {pdfUrl && (
            <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page pageNumber={pageNumber} />
            </Document>
          )}
          {signatureAreas.map((area) => (
            <div
              key={area.id}
              style={{
                position: "absolute",
                top: area.top,
                left: area.left,
                width: area.width,
                height: area.height,
                border: "2px dashed red",
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                cursor: "move",
              }}
              draggable
              onDrag={(e) => handleDrag(e, area.id)}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "blue",
                  cursor: "nwse-resize",
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => handleResize(e, area.id)}
              ></div>
              {area.signature && (
                <img
                  src={area.signature}
                  alt="Signature"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div>
          <SignaturePad
            ref={signaturePadRef}
            canvasProps={{
              width: 300,
              height: 100,
              style: { border: "1px solid black" },
            }}
          />
          <button onClick={handleSaveSignature}>Lưu chữ ký</button>
          <button onClick={handleClearSignature}>Xóa chữ ký</button>
        </div>
        <button onClick={() => signatureAreas.forEach((area) => applySignature(area.id))}>
          Chèn chữ ký vào vùng
        </button>
      </div>
    </div>
  );
};

export default SignaturePage;
