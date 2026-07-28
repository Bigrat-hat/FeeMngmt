-- Coaching Fees Management System - Database Architecture (PostgreSQL Schema)
-- Version: 1.0.0

-- Drop existing tables if re-initializing
DROP TABLE IF EXISTS extra_charges;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS students;

-- Table: students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female')),
    class VARCHAR(20) NOT NULL,
    school VARCHAR(150) NULL,
    board VARCHAR(50) NULL,
    monthly_fee NUMERIC(10,2) NOT NULL CHECK (monthly_fee >= 0),
    joining_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Left', 'Session Closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    month VARCHAR(15) NOT NULL,
    year INTEGER NOT NULL,
    monthly_fee NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL CHECK (paid_amount >= 0),
    remaining_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (remaining_amount >= 0),
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'Online')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: extra_charges
CREATE TABLE extra_charges (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    date DATE NOT NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('Paid', 'Pending')),
    paid_with_fee BOOLEAN DEFAULT FALSE
);

-- Indices for performance optimization
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_year_month ON payments(year, month);
CREATE INDEX idx_extra_charges_student ON extra_charges(student_id);
