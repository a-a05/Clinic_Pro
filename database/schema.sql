CREATE TABLE Roles (
    RoleID SERIAL PRIMARY KEY,
    RoleName VARCHAR(50) UNIQUE NOT NULL,
    Description TEXT
);

CREATE TABLE Countries (
    CountryID SERIAL PRIMARY KEY,
    CountryName VARCHAR(100) NOT NULL
);

CREATE TABLE People (
    PersonID SERIAL PRIMARY KEY,
    NationalID VARCHAR(20) UNIQUE,
    FirstName VARCHAR(50) NOT NULL,
    SecondName VARCHAR(50),
    ThirdName VARCHAR(50),
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE,
    Gender VARCHAR(10),
    Address TEXT,
    PhoneNo VARCHAR(20) NOT NULL,
    Email VARCHAR(100),
    NationalCountryID INT REFERENCES Countries(CountryID),
    ImagePath TEXT
);

CREATE TABLE Users (
    UserID SERIAL PRIMARY KEY,
    PersonID INT UNIQUE REFERENCES People(PersonID) ON DELETE CASCADE,
    UserName VARCHAR (50) UNIQUE NOT NULL, 
    Password VARCHAR (255) NOT NULL,
    RoleID INT REFERENCES Roles(RoleID),
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE Patients (
    PatientID SERIAL PRIMARY KEY,
    PersonID INT UNIQUE REFERENCES People(PersonID) ON DELETE CASCADE,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedByUserID INT REFERENCES Users(UserID),
    CreatedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Appointments (
    AppointmentID SERIAL PRIMARY KEY,
    PatientID INT REFERENCES Patients(PatientID),
    DoctorUserID INT REFERENCES Users(UserID),
    CreatedByUserID INT REFERENCES Users(UserID),
    AppointmentDate DATE,
    StartsAt TIMESTAMPTZ,
    EndsAt TIMESTAMPTZ,
    Reason TEXT,
    AppointmentStatus VARCHAR(50)
);

CREATE TABLE Visits (
    VisitID SERIAL PRIMARY KEY,
    AppointmentID INT UNIQUE REFERENCES Appointments(AppointmentID),
    CheckedInAt TIMESTAMPTZ,
    StartedAt TIMESTAMPTZ,
    EndedAt TIMESTAMPTZ,
    VisitStatus VARCHAR(50)
);

CREATE TABLE VisitNotes (
    VisitNoteID SERIAL PRIMARY KEY,
    VisitID INT UNIQUE REFERENCES Visits(VisitID),
    WrittenByDoctorUserID INT REFERENCES Users(UserID),
    NoteText TEXT,
    CreatedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TreatmentPlans (
    TreatmentPlanID SERIAL PRIMARY KEY,
    PatientID INT REFERENCES Patients(PatientID),
    CreatedByUserID INT REFERENCES Users(UserID),
    PlanName VARCHAR(100),
    PlanStatus VARCHAR(50),
    CreatedDate TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TreatmentPlanItems (
    PlanItemID SERIAL PRIMARY KEY,
    TreatmentPlanID INT REFERENCES TreatmentPlans(TreatmentPlanID) ON DELETE CASCADE,
    ProcedureName VARCHAR(100),
    ToothNumber VARCHAR(10),
    EstimatedCost NUMERIC(10, 2),
    ItemStatus VARCHAR(50)
);

CREATE TABLE Invoices (
    InvoiceID SERIAL PRIMARY KEY,
    PatientID INT REFERENCES Patients(PatientID),
    VisitID INT REFERENCES Visits(VisitID),
    CreatedByUserID INT REFERENCES Users(UserID),
    InvoiceNumber VARCHAR(50) UNIQUE NOT NULL,
    TotalAmount NUMERIC(10, 2),
    InvoiceStatus VARCHAR(50),
    IssuedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Payments (
    PaymentID SERIAL PRIMARY KEY,
    InvoiceID INT REFERENCES Invoices(InvoiceID) ON DELETE CASCADE,
    ReceivedByUserID INT REFERENCES Users(UserID),
    Amount NUMERIC(10, 2),
    Method VARCHAR(50),
    PaidAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE OTP_Tokens (
    OTP_ID SERIAL PRIMARY KEY,
    Identifier VARCHAR(255) NOT NULL,
    OTP_Code VARCHAR(10) NOT NULL,
    ExpiresAt TIMESTAMP NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);