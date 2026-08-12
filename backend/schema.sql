-- Auto-generated MySQL schema (also created automatically via `flask db upgrade`)
-- Run: mysql -u root -p rental_saas < schema.sql

CREATE TABLE subscription_plans (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	name VARCHAR(50) NOT NULL, 
	price_per_month NUMERIC(10, 2) NOT NULL, 
	room_limit INTEGER, 
	multi_property BOOL, 
	features JSON, 
	is_active BOOL, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	`role` ENUM('admin','owner','tenant') NOT NULL, 
	full_name VARCHAR(120) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	phone VARCHAR(32), 
	photo_url VARCHAR(255), 
	is_active BOOL, 
	created_at DATETIME, 
	updated_at DATETIME, 
	reset_token VARCHAR(128), 
	reset_token_expires DATETIME, 
	PRIMARY KEY (id)
);

CREATE TABLE app_settings (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	`key` VARCHAR(80) NOT NULL, 
	value TEXT, 
	category VARCHAR(40), 
	is_secret BOOL, 
	updated_at DATETIME, 
	updated_by_user_id INTEGER, 
	PRIMARY KEY (id), 
	UNIQUE (`key`), 
	FOREIGN KEY(updated_by_user_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER, 
	action VARCHAR(120), 
	entity VARCHAR(60), 
	entity_id INTEGER, 
	meta JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE notifications (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	type VARCHAR(40), 
	title VARCHAR(150), 
	body TEXT, 
	is_read BOOL, 
	created_at DATETIME, 
	sent_sms BOOL, 
	sent_whatsapp BOOL, 
	sent_telegram BOOL, 
	sent_email BOOL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE owner_profiles (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	company_name VARCHAR(150), 
	gst_number VARCHAR(30), 
	plan_id INTEGER, 
	subscription_status ENUM('trialing','active','past_due','cancelled'), 
	subscription_renews_at DATE, 
	telegram_chat_id VARCHAR(64), 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(plan_id) REFERENCES subscription_plans (id)
);

CREATE TABLE properties (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER NOT NULL, 
	name VARCHAR(120) NOT NULL, 
	property_type VARCHAR(50), 
	location VARCHAR(200), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE reminder_rules (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER NOT NULL, 
	days_before_due INTEGER, 
	days_after_due_for_overdue INTEGER, 
	channel_sms BOOL, 
	channel_whatsapp BOOL, 
	channel_telegram BOOL, 
	channel_inapp BOOL, 
	late_fee_flat NUMERIC(10, 2), 
	late_fee_pct NUMERIC(5, 2), 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE subscription_invoices (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER NOT NULL, 
	plan_id INTEGER NOT NULL, 
	amount NUMERIC(10, 2) NOT NULL, 
	period_start DATE, 
	period_end DATE, 
	status ENUM('pending','paid','failed'), 
	gateway_payment_id VARCHAR(120), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id), 
	FOREIGN KEY(plan_id) REFERENCES subscription_plans (id)
);

CREATE TABLE tenant_profiles (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	created_by_owner_id INTEGER, 
	age INTEGER, 
	father_name VARCHAR(120), 
	occupation VARCHAR(120), 
	company_name VARCHAR(150), 
	gst_number VARCHAR(30), 
	pan_number VARCHAR(20), 
	pan_upload_url VARCHAR(255), 
	current_address TEXT, 
	permanent_address TEXT, 
	id_proof_type VARCHAR(50), 
	id_proof_number VARCHAR(60), 
	id_proof_upload_url VARCHAR(255), 
	police_verification BOOL, 
	police_verification_upload_url VARCHAR(255), 
	emergency_contact_name VARCHAR(120), 
	emergency_contact_phone VARCHAR(32), 
	telegram_chat_id VARCHAR(64), 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(created_by_owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE documents (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER, 
	tenant_id INTEGER, 
	category VARCHAR(50), 
	title VARCHAR(150), 
	file_url VARCHAR(255) NOT NULL, 
	uploaded_by_user_id INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id), 
	FOREIGN KEY(uploaded_by_user_id) REFERENCES users (id)
);

CREATE TABLE message_threads (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	owner_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	subject VARCHAR(150), 
	created_at DATETIME, 
	last_message_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id)
);

CREATE TABLE rooms (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	property_id INTEGER NOT NULL, 
	unit_number VARCHAR(30) NOT NULL, 
	rent_type VARCHAR(30), 
	unit_type VARCHAR(60), 
	floor VARCHAR(20), 
	monthly_rent NUMERIC(10, 2), 
	advance_amount NUMERIC(10, 2), 
	electricity_charge NUMERIC(10, 2), 
	water_charge NUMERIC(10, 2), 
	maintenance_charge NUMERIC(10, 2), 
	bhk_1 NUMERIC(10, 2), 
	bhk_2 NUMERIC(10, 2), 
	bhk_3 NUMERIC(10, 2), 
	bhk_4 NUMERIC(10, 2), 
	amenities JSON, 
	status ENUM('vacant','occupied','close_to_expire','maintenance'), 
	notes TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE TABLE agreements (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	agreement_number VARCHAR(40) NOT NULL, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	owner_id INTEGER NOT NULL, 
	rent_type VARCHAR(30), 
	monthly_rent NUMERIC(10, 2), 
	security_deposit NUMERIC(10, 2), 
	start_date DATE NOT NULL, 
	end_date DATE NOT NULL, 
	next_billing_date DATE, 
	status ENUM('active','expired','terminated'), 
	auto_renew_pct NUMERIC(5, 2), 
	pdf_url VARCHAR(255), 
	tenant_signed_at DATETIME, 
	tenant_signature_name VARCHAR(120), 
	owner_signed_at DATETIME, 
	owner_signature_name VARCHAR(120), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (agreement_number), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE invoices (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	invoice_number VARCHAR(40) NOT NULL, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	owner_id INTEGER NOT NULL, 
	billing_month VARCHAR(20), 
	due_date DATE NOT NULL, 
	paid_date DATE, 
	rent_type VARCHAR(30), 
	rent NUMERIC(10, 2), 
	electricity NUMERIC(10, 2), 
	water NUMERIC(10, 2), 
	maintenance NUMERIC(10, 2), 
	other_charges NUMERIC(10, 2), 
	late_fee NUMERIC(10, 2), 
	sgst_pct NUMERIC(5, 2), 
	cgst_pct NUMERIC(5, 2), 
	total NUMERIC(10, 2), 
	paid_amount NUMERIC(10, 2), 
	status ENUM('pending','paid','partially_paid','overdue'), 
	pdf_url VARCHAR(255), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (invoice_number), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE maintenance_tickets (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	owner_id INTEGER NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	description TEXT, 
	category VARCHAR(50), 
	priority ENUM('low','medium','high','urgent'), 
	status ENUM('open','in_progress','resolved','closed'), 
	photo_url VARCHAR(255), 
	created_at DATETIME, 
	updated_at DATETIME, 
	resolved_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);

CREATE TABLE messages (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	thread_id INTEGER NOT NULL, 
	sender_user_id INTEGER NOT NULL, 
	body TEXT NOT NULL, 
	is_read BOOL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(thread_id) REFERENCES message_threads (id), 
	FOREIGN KEY(sender_user_id) REFERENCES users (id)
);

CREATE TABLE meter_readings (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	meter_type ENUM('electricity','water') NOT NULL, 
	reading_value NUMERIC(10, 2) NOT NULL, 
	photo_url VARCHAR(255), 
	reading_month VARCHAR(20), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id)
);

CREATE TABLE room_assignments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	assigned_at DATE NOT NULL, 
	vacated_at DATE, 
	notes TEXT, 
	is_active BOOL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id)
);

CREATE TABLE visitor_logs (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	room_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	visitor_name VARCHAR(120) NOT NULL, 
	visitor_phone VARCHAR(32), 
	purpose VARCHAR(150), 
	expected_date DATE, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id)
);

CREATE TABLE inspection_reports (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	room_id INTEGER NOT NULL, 
	assignment_id INTEGER, 
	inspection_type ENUM('move_in','move_out') NOT NULL, 
	checklist JSON, 
	photo_urls JSON, 
	conducted_by_user_id INTEGER, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(room_id) REFERENCES rooms (id), 
	FOREIGN KEY(assignment_id) REFERENCES room_assignments (id), 
	FOREIGN KEY(conducted_by_user_id) REFERENCES users (id)
);

CREATE TABLE lease_renewal_requests (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	agreement_id INTEGER NOT NULL, 
	proposed_rent NUMERIC(10, 2), 
	proposed_start DATE, 
	proposed_end DATE, 
	status ENUM('pending','accepted','declined'), 
	created_at DATETIME, 
	responded_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(agreement_id) REFERENCES agreements (id)
);

CREATE TABLE payments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	invoice_id INTEGER NOT NULL, 
	amount NUMERIC(10, 2) NOT NULL, 
	method VARCHAR(40), 
	reference VARCHAR(120), 
	notes TEXT, 
	paid_at DATETIME, 
	gateway VARCHAR(30), 
	gateway_order_id VARCHAR(120), 
	gateway_payment_id VARCHAR(120), 
	gateway_status VARCHAR(30), 
	PRIMARY KEY (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
);

CREATE TABLE vacate_requests (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	assignment_id INTEGER NOT NULL, 
	tenant_id INTEGER NOT NULL, 
	owner_id INTEGER NOT NULL, 
	requested_vacate_date DATE NOT NULL, 
	reason TEXT, 
	status ENUM('pending','approved','rejected'), 
	created_at DATETIME, 
	responded_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assignment_id) REFERENCES room_assignments (id), 
	FOREIGN KEY(tenant_id) REFERENCES tenant_profiles (id), 
	FOREIGN KEY(owner_id) REFERENCES owner_profiles (id)
);