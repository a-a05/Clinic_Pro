import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const clinicTools = {
    functionDeclarations: [
        {
            name: "find_available_slots",
            description: "البحث عن المواعيد المتاحة للأطباء في يوم محدد.",
            parameters: {
                type: "OBJECT",
                properties: {
                    date: {
                        type: "STRING",
                        description: "التاريخ المطلوب للبحث بصيغة YYYY-MM-DD"
                    }
                },
                required: ["date"]
            }
        },
        {
            name: "book_appointment",
            description: "تثبيت وحجز موعد للمريض في قاعدة البيانات بعد اختياره للوقت وتوفر جميع بياناته.",
            parameters: {
                type: "OBJECT",
                properties: {
                    patientName: {
                        type: "STRING",
                        description: "اسم المريض الكامل (اتركه فارغاً أو اضبطه حسب الحاجة إذا كان مسجل دخول)"
                    },
                    phoneNo: {
                        type: "STRING",
                        description: "رقم هاتف المريض"
                    },
                    doctorId: {
                        type: "INTEGER",
                        description: "رقم معرف الطبيب (doctorId)، والافتراضي هو 2 إذا لم يتوفر غيره"
                    },
                    date: {
                        type: "STRING",
                        description: "تاريخ الموعد بصيغة YYYY-MM-DD"
                    },
                    time: {
                        type: "STRING",
                        description: "وقت الموعد بنظام 24 ساعة بصيغة HH:MM مثل 09:00 أو 14:00"
                    },
                    reason: {
                        type: "STRING",
                        description: "سبب الزيارة أو الألم الذي يعاني منه المريض"
                    }
                },
                required: ["doctorId", "date", "time", "reason"]
            }
        }
    ]
};

const getBaseSystemPrompt = (isLoggedIn, userInfo) => {
    if (isLoggedIn && userInfo) {
        return `أنت مساعد ذكي ولطيف لنظام حجز وإدارة عيادات أسنان في الأردن.
المريض الحالي مسجل دخول بالنظام، واسمه "${userInfo.firstName} ${userInfo.lastName}" ورقم هاتفه "${userInfo.phoneNo}".
مهمتك هي الرد عليه بلهجة أردنية طبيعية ومختصرة.
لا تطلب منه اسمه أو رقم هاتفه لأنه مسجل مسبقاً، فقط اطلب منه سبب الزيارة وتاريخ الموعد المرغوب لحجز موعده مباشرة.
عندما يحدد التاريخ، استخدم أداة find_available_slots. وعندما يختار الوقت، استخدم أداة book_appointment.
تحدث بنص عادي (Plain text) فقط بدون أي تنسيقات Markdown أو نجوم.`;
    } else {
        return `أنت مساعد ذكي ولطيف لنظام حجز وإدارة عيادات أسنان في الأردن.
المريض زائر غير مسجل دخول.
مهمتك هي الرد على المرضى بلهجة أردنية طبيعية، محترمة، ومختصرة.
خطوات عملك:
1. اجمع معلومات المريض الناقصة (الاسم الكامل، رقم الهاتف، سبب الزيارة، والتاريخ المطلوب).
2. عندما يحدد المريض تاريخاً، استدعِ أداة find_available_slots لجلب المواعيد المتاحة.
3. عندما يختار المريض وقتاً وتتوفر بياناته، استدعِ أداة book_appointment لتثبيت الحجز.
تحدث بنص عادي (Plain text) فقط بدون أي تنسيقات Markdown أو نجوم.`;
    }
};

export const handleChat = async (req, res) => {
    try {
        const { message, history, userId } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        let isLoggedIn = false;
        let userInfo = null;
        if (userId) {
            const userQuery = await pool.query(
                `SELECT u.UserID, p.FirstName, p.LastName, p.PhoneNo, pat.PatientID
                 FROM Users u
                 JOIN People p ON u.PersonID = p.PersonID
                 LEFT JOIN Patients pat ON p.PersonID = pat.PersonID
                 WHERE u.UserID = $1`,
                [userId]
            );
            if (userQuery.rows.length > 0) {
                isLoggedIn = true;
                userInfo = userQuery.rows[0];
            }
        }

        const systemPrompt = getBaseSystemPrompt(isLoggedIn, userInfo);

        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            tools: [clinicTools],
            systemInstruction: systemPrompt
        });

        const chat = model.startChat({
            history: history || []
        });

        let result = await chat.sendMessage(message);
        let response = result.response;

        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            const replyModel = genAI.getGenerativeModel({
                model: "gemini-3.5-flash",
                systemInstruction: systemPrompt
            });

            const replyChat = replyModel.startChat({
                history: history || []
            });

            if (call.name === 'find_available_slots') {
                const requestedDate = call.args.date;
                console.log(`AI is searching for an available appointment on: ${requestedDate}`);

                const apiRes = await fetch(`http://localhost:5000/api/appointments/available-slots?date=${requestedDate}`);
                const slotsData = await apiRes.json();

                result = await replyChat.sendMessage(
                    `${message}\n\n[بيانات من قاعدة البيانات: المواعيد المتاحة ليوم ${requestedDate} هي: ${JSON.stringify(slotsData.availableSlots)} - اعرض هذه الأوقات واسم الدكتور للمريض بلهجة أردنية ليختار الوقت المناسب]`
                );
                response = result.response;
            }

            if (call.name === 'book_appointment') {
                const { doctorId, date, time, reason } = call.args;
                const finalPatientName = isLoggedIn ? `${userInfo.firstname} ${userInfo.lastname}` : call.args.patientName;
                const finalPhoneNo = isLoggedIn ? userInfo.phoneno : call.args.phoneNo;
                const creatorUserId = isLoggedIn ? userInfo.userid : null;

                console.log(`AI is booking an appointment for ${finalPatientName} on ${date} at ${time}`);
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    let patientId;

                    if (isLoggedIn && userInfo.patientid) {
                        patientId = userInfo.patientid;
                    } else {
                        const existingPatient = await client.query(
                            `SELECT pat.PatientID 
                             FROM Patients pat
                             JOIN People p ON pat.PersonID = p.PersonID
                             WHERE p.PhoneNo = $1 LIMIT 1`,
                            [finalPhoneNo]
                        );

                        if (existingPatient.rows.length > 0) {
                            patientId = existingPatient.rows[0].patientid;
                        } else {
                            const existingPerson = await client.query(
                                `SELECT PersonID FROM People WHERE PhoneNo = $1 LIMIT 1`,
                                [finalPhoneNo]
                            );

                            let personId;
                            if (existingPerson.rows.length > 0) {
                                personId = existingPerson.rows[0].personid;
                            } else {
                                const nameParts = (finalPatientName || 'Guest User').trim().split(/\s+/);
                                const firstName = nameParts[0] || 'Patient';
                                const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'User';
                                const secondName = nameParts.length > 2 ? nameParts[1] : null;
                                const thirdName = nameParts.length > 3 ? nameParts.slice(2, -1).join(' ') : null;

                                const newPerson = await client.query(
                                    `INSERT INTO People (FirstName, SecondName, ThirdName, LastName, PhoneNo)
                                     VALUES ($1, $2, $3, $4, $5) RETURNING PersonID`,
                                    [firstName, secondName, thirdName, lastName, finalPhoneNo]
                                );
                                personId = newPerson.rows[0].personid;
                            }

                            const newPatient = await client.query(
                                `INSERT INTO Patients (PersonID, CreatedByUserID) 
                                 VALUES ($1, $2) RETURNING PatientID`,
                                [personId, creatorUserId]
                            );
                            patientId = newPatient.rows[0].patientid;
                        }
                    }
                    const startHour = parseInt(time.split(':')[0], 10);
                    const startTimeFormatted = `${String(startHour).padStart(2, '0')}:00:00`;
                    const endTimeFormatted = `${String(startHour + 1).padStart(2, '0')}:00:00`;
                    const startsAt = `${date} ${startTimeFormatted}`;
                    const endsAt = `${date} ${endTimeFormatted}`;
                    const newApp = await client.query(
                        `INSERT INTO Appointments 
                         (PatientID, DoctorUserID, CreatedByUserID, AppointmentDate, StartsAt, EndsAt, Reason, AppointmentStatus)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Scheduled')
                         RETURNING AppointmentID`,
                        [patientId, doctorId || 2, creatorUserId, date, startsAt, endsAt, reason]
                    );

                    await client.query('COMMIT');
                    result = await replyChat.sendMessage(
                        `${message}\n\n[بيانات من النظام: تم تثبيت الحجز بنجاح برقم ${newApp.rows[0].appointmentid} للمريض ${finalPatientName} بتاريخ ${date} الساعة ${time}. أكد الحجز للمريض بلهجة أردنية لطيفة]`
                    );
                    response = result.response;

                } catch (dbErr) {
                    await client.query('ROLLBACK');
                    console.error('Database Booking Error: ', dbErr.message);
                    result = await replyChat.sendMessage(
                        `${message}\n\n[بيانات من النظام: حدث خطأ تقني أثناء حفظ الموعد، اعتذر من المريض بلطف واطلب منه المحاولة مرة أخرى]`
                    );
                    response = result.response;
                } finally {
                    client.release();
                }
            }
        }

        const text = response.text();
        res.status(200).json({
            reply: text
        });

    } catch (error) {
        console.error('Error in chatController: ', error);
        res.status(500).json({
            error: 'An error occurred while communicating with your AI assistant.'
        });
    }
};