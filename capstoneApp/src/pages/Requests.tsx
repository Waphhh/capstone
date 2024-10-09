import React, { useState, useEffect } from 'react';
import { IonButton, IonToast, IonContent, IonHeader, IonPage, IonToolbar, IonTitle, IonLoading } from '@ionic/react';
import { auth, db, storage } from './firebaseConfig'; // Firestore config
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'; // Firestore functions
import ExcelJS from 'exceljs'; // Import ExcelJS
import { getDownloadURL, ref } from 'firebase/storage';
import './Requests.css'; // Custom CSS for styling

const Requests: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null); // For uploaded file
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false); // Loading state

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user ? user : null);
        });

        return () => unsubscribe();
    }, []);

    // Handle file input for uploading Excel
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Extract request date from filename
    const extractRequestDateFromFilename = (filename: string) => {
        const parts = filename.split('_');
        if (parts.length === 2) {
            const decodedDate = decodeURIComponent(parts[1].split('.wav')[0]);
            return decodedDate;
        }
        return null;
    };

    // Update Firebase with Excel data
    const updateHistoryFromExcel = async () => {
        if (!file) return;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.getWorksheet('Users Requests');

        const updates: any[] = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const phoneNumber = row.getCell(1).value?.toString();
            const cellValue = row.getCell(6).value;
            const recordingUrl = typeof cellValue === 'object' && 'hyperlink' in cellValue ? cellValue.hyperlink : null;
            const requestStatus = row.getCell(7).value?.toString();
            const comments = row.getCell(9).value?.toString();

            if (phoneNumber && recordingUrl && requestStatus) {
                const recordingFilename = recordingUrl.split('/').pop();
                const requestDate = extractRequestDateFromFilename(recordingFilename!);

                if (requestDate) {
                    const userRef = doc(db, 'users', phoneNumber);
                    const updateData: any = {
                        [`requests.${requestDate}`]: requestStatus
                    };

                    if (comments) {
                        updateData[`history.${requestDate}`] = comments;
                    }

                    updates.push(updateDoc(userRef, updateData));
                }
            }
        });

        await Promise.all(updates);
        alert("Request history updated successfully in Firebase!");
    };

    const downloadXLS = async (data: any[]) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Users Requests');
    
        worksheet.columns = [
            { header: 'Phone Number', key: 'phoneNumber', width: 20 },
            { header: 'Postal Code', key: 'postalCode', width: 20 },
            { header: 'Unit No', key: 'flatNo', width: 20 },
            { header: 'Language', key: 'language', width: 20 },
            { header: 'Request Date', key: 'requestDate', width: 25, style: { numFmt: 'mmmm d, yyyy hh:mm:ss' } },
            { header: 'Recording URL', key: 'recordingUrl', width: 50 },
            { header: 'Request Status', key: 'requestStatus', width: 25, style: { alignment: { wrapText: true } } },
            { header: 'Remarks', key: 'remarks', width: 25, style: { alignment: { wrapText: true } } },
            { header: 'Comments', key: 'comments', width: 25 }
        ];
    
        // Define the drop-down options for Request Status
        const requestStatusOptions = ['Pending', 'Accepted', 'Completed'];
    
        for (const item of data) {
            const row = worksheet.addRow({
                phoneNumber: item.phoneNumber.toString(),
                postalCode: Number(item.postalCode),
                flatNo: item.flatNo,
                language: item.language,
                requestDate: item.requestDate,
                requestStatus: item.requestStatus,
                recordingUrl: {
                    text: 'Recording Link',
                    hyperlink: item.recordingUrl
                },
                remarks: item.remarks,
                comments: item.comments
            });
    
            const hyperlinkCell = row.getCell('recordingUrl');
            hyperlinkCell.font = {
                color: { argb: 'FF0000FF' },
                underline: true,
            };
    
            // Ensure that remarks are wrapped in the cell
            const remarksCell = row.getCell('remarks');
            remarksCell.alignment = { wrapText: true };
    
            // Apply the same validation for the Request Status column in each row
            row.getCell('requestStatus').dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`"${requestStatusOptions.join(',')}"`],
                showErrorMessage: true,
                errorTitle: 'Invalid Selection',
                error: 'Please select a value from the drop-down list.'
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
            setLoading(true); // Show loading indicator
            try {
                const usersCollectionRef = collection(db, 'users');
                const querySnapshot = await getDocs(usersCollectionRef);

                const usersData: any[] = [];
                const storageBaseUrl = 'recordings/';

                for (const doc of querySnapshot.docs) {
                    const data = doc.data();
                    const { phoneNumber = '', postalCode = '', flatNo = '', language = '', requests = {}, remarks = {}, history = {} } = data;

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
                            remarks: remarks[requestDate],
                            comments: history[requestDate]
                        });
                    }
                }

                usersData.sort((a, b) => a.requestDate.getTime() - b.requestDate.getTime());
                console.log(usersData);
                downloadXLS(usersData);
            } catch (error) {
                console.error("Error fetching users: ", error);
            } finally {
                setLoading(false); // Hide loading indicator
            }
        } else {
            setShowError(true);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Requests Dashboard</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent className="ion-padding">
                <div className="requests-container">
                    <h2>Download Requests</h2>
                    <IonButton expand="block" color="primary" onClick={getRequests}>Get Requests & Download Excel</IonButton>

                    <h2>Upload Excel to Update History</h2>
                    <input type="file" onChange={handleFileInput} />
                    <IonButton expand="block" color="secondary" onClick={updateHistoryFromExcel}>Update Firebase from Excel</IonButton>
                </div>

                <IonToast
                    isOpen={showError}
                    onDidDismiss={() => setShowError(false)}
                    message="You must be signed in to view requests."
                    duration={3000}
                    color="danger"
                />

                <IonLoading isOpen={loading} message="Fetching data..." />
            </IonContent>
        </IonPage>
    );
};

export default Requests;
