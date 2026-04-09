# iCrowd E-commerce Platform 

**CSC3213 - Project in Computer Science I**  | **University of Peradeniya** 

A centralized digital storefront and full-stack e-commerce platform developed for iCrowd Phone Accessories. This system transitions manual retail operations into a scalable online environment, featuring automated inventory management and a streamlined purchasing process. The project is built using a **Monorepo** structure and a **Vertical Slice** architecture.

---

## ✨ Key Features

* **Identity & Access Management:** Secure registration and login utilizing JSON Web Tokens (JWT) and Role-Based Access Control (RBAC) to separate Customer and Administrator privileges.
* **Concurrency & Stock Control:** Implements ACID-compliant database transactions and pessimistic row-level locking to prevent race conditions and inventory overselling during simultaneous checkouts.
* **Dynamic Product Discovery:** A responsive product catalogue featuring multi-level filtering (category, price, and **exact smartphone device compatibility**) and keyword search, backed by a many-to-many database architecture.
* **Admin Dashboard & Analytics:** A secure back-office interface for inventory CRUD operations, promotional discount management, and graphical data visualization (pie charts and graphs) of profit margins, **enhanced by an AI-driven prediction and decision-making system** to forecast inventory needs.
* **Secure Checkout & Payments:** A persistent shopping cart that seamlessly routes tokenized payment intents to an external Payment Gateway.
* **Automated Notifications:** Integration with external SMTP services to automatically dispatch order confirmation emails and low-stock alerts.

---

## 🛠️ Tech Stack & Architecture

* **Frontend:** React (Responsive web interface accessible via modern browsers) 
* **Backend:** Java Spring Boot (RESTful API architecture) 
* **Database:** Relational Database Management System (e.g., PostgreSQL/MySQL) 
* **Data Exchange:** JSON over secure HTTPS 

---

## 📂 Repository Structure

This project utilizes a Monorepo approach to house all system components.

```text
CSC3213_20_Group_J/
├── iCrowd_UI/       # React customer storefront and admin UI
├── iCrowd_backend/        # Spring Boot REST API and business logic
└── README.md       # Project entry point

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
* Node.js (v18 or higher recommended)
* Java Development Kit (JDK) (v17 or higher recommended)
* A running instance of your chosen Relational Database.

---

## 👥 The Team

Developed by Group J:

* Vinod Rangana
* Kusal Asinsana
* Shalika Sandaru
* Shashika Adithya


