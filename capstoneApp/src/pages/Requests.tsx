import React, { useState, useEffect } from 'react';
import { IonButton, IonToast } from '@ionic/react';
import { auth, db, storage } from './firebaseConfig'; // Firestore config
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // Firestore functions
import ExcelJS from 'exceljs'; // Import ExcelJS
import { getDownloadURL, ref } from 'firebase/storage';

const Requests: React.FC = () => {
    const [user, setUser] = useState(null);
    const [file, setFile] = useState<File | null>(null); // To hold the uploaded file
    const [showError, setShowError] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle file input for uploading modified Excel
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Function to extract request date from the filename (e.g., phoneNumber_2024-09-26T16:15:00.wav)
    const extractRequestDateFromFilename = (filename: string) => {
        const parts = filename.split('_');
        if (parts.length === 2) {
            const decodedDate = decodeURIComponent(parts[1].split('.wav')[0]); // Decode %3A to :
            return decodedDate;
        }
        return null;
    };

    // Update only the 'requests' field in Firebase using the filename for date
    const updateHistoryFromExcel = async () => {
        if (!file) return;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.getWorksheet('Users Requests');

        const updates = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const phoneNumber = row.getCell(1).value?.toString(); // Phone number column
            const cellValue = row.getCell(6).value;
            const recordingUrl = typeof cellValue === 'object' && 'hyperlink' in cellValue ? cellValue.hyperlink : null;
            const requestStatus = row.getCell(7).value?.toString(); // Request status column
            const comments = row.getCell(8).value?.toString(); // Comments column (H)

            if (phoneNumber && recordingUrl && requestStatus) {
                // Extract the request date from the filename
                const recordingFilename = recordingUrl.split('/').pop(); // Extract file name from URL
                const requestDate = extractRequestDateFromFilename(recordingFilename!);

                if (requestDate) {
                    // Update the 'requests' field in Firebase using extracted date
                    const userRef = doc(db, 'users', phoneNumber);
                    const updateData: any = {
                        [`requests.${requestDate}`]: requestStatus // Update the request status
                    };

                    if (comments) {
                        updateData[`history.${requestDate}`] = comments;
                    }    

                    updates.push(updateDoc(userRef, updateData)); // Queue the update
                }
            }
        });

        // Execute all updates
        await Promise.all(updates);
        alert("Request history updated successfully in Firebase!");
    };

    const downloadXLS = async (data: any[]) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users Requests');

        // Define columns for the worksheet
        worksheet.columns = [
            { header: 'Phone Number', key: 'phoneNumber', width: 20 },
            { header: 'Postal Code', key: 'postalCode', width: 20 },
            { header: 'Flat No', key: 'flatNo', width: 20 },
            { header: 'Language', key: 'language', width: 20 },
            { header: 'Request Date', key: 'requestDate', width: 25, style: { numFmt: 'mmmm d, yyyy hh:mm:ss' } },
            { header: 'Recording URL', key: 'recordingUrl', width: 50 },
            { header: 'Request Status', key: 'requestStatus', width: 25 },
            { header: 'Comments', width: 25 }
        ];

        // Add rows to the worksheet
        for (const item of data) {
            const row = worksheet.addRow({
                phoneNumber: item.phoneNumber.toString(),
                postalCode: Number(item.postalCode),
                flatNo: Number(item.flatNo),
                language: item.language,
                requestDate: item.requestDate,
                requestStatus: item.requestStatus,
                recordingUrl: {
                    text: 'Recording Link',
                    hyperlink: item.recordingUrl
                }
            });

            const hyperlinkCell = row.getCell('recordingUrl');
            hyperlinkCell.font = {
                color: { argb: 'FF0000FF' },
                underline: true,
            };
        }

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_requests.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const getRequests = async () => {
        if (user) {
            try {
                const usersCollectionRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersCollectionRef);

                const usersData: any[] = [];
                const storageBaseUrl = 'recordings/';

                for (const doc of querySnapshot.docs) {
                    const data = doc.data();
                    const { phoneNumber = '', postalCode = '', flatNo = '', language = '', requests = {} } = data;

                    for (const [requestDate, requestStatus] of Object.entries(requests)) {
                        const formattedDate = new Date(requestDate);
                        formattedDate.setHours(formattedDate.getHours() + 8);
                        const recordingFileName = `${phoneNumber}_${requestDate}.wav`;

                        const recordingRef = ref(storage, `${storageBaseUrl}${recordingFileName}`);
                        const recordingUrl = await getDownloadURL(recordingRef);

                        usersData.push({
                            id: doc.id,
                            phoneNumber,
                            postalCode,
                            flatNo,
                            language,
                            requestDate: formattedDate,
                            requestStatus,
                            recordingUrl,
                        });
                    }
                }

                usersData.sort((a, b) => a.requestDate.getTime() - b.requestDate.getTime());

                downloadXLS(usersData);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        } else {
            setShowError(true);
        }
    };


    return (
        <div>
            <h1>Requests Page</h1>
            <IonButton onClick={getRequests}>Get Requests & Download Excel</IonButton>

            <h2>Upload Excel to Update Request History</h2>
            <input type="file" onChange={handleFileInput} />
            <IonButton onClick={updateHistoryFromExcel}>Update Firebase from Excel</IonButton>

            {/* Error Toast */}
            <IonToast
                isOpen={showError}
                onDidDismiss={() => setShowError(false)}
                message="You must be signed in to view requests."
                duration={3000}
                color="danger"
            />
        </div>
    );
};

export default Requests;
