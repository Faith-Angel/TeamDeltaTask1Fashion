# Requirements Document

## Introduction

This document defines the requirements for **NdoloStitch** — a Next.js 15 Progressive Web App (PWA) targeting the fashion industry in Cameroon. The app connects four distinct user roles — Clients, Designers, Vendors, and Marketers — through a unified platform that enables fashion discovery, designer collaboration, marketplace commerce, and marketer bookings. The platform features a Savanna Bloom Afrocentric UI aesthetic and integrates local payment solutions (MTN Mobile Money and Orange Money) to serve the Cameroonian market.

Requirements 14–16 extend the platform with three additional capabilities: Designer Training Programs (enabling Designers to create structured courses that Clients can enroll in via mobile payment), a Designer Planner (a built-in calendar tool that consolidates training sessions, appointments, and delivery deadlines), and Designer Collaboration (a feature allowing Designers to form joint projects with shared workspaces and portfolio visibility).

---

## Glossary

- **App**: The Cameroon Fashion cross-platform mobile application built with React Native.
- **Client**: A registered user who browses fashion content, discovers designers and vendors, makes purchases, and communicates with designers either for training purposes or for designing purposes.
- **Designer**: A registered user who manages a professional portfolio, handles client appointments, hires Marketers for brand promotion, trains clients who have applied and paid for training and collaborates with other designers on bigger projects.
- **Vendor**: A registered user who uploads a product catalog and fulfills orders for fashion items and services.
- **Marketer**: A registered user subdivided into Models and Content Creators, who maintains a portfolio of work and accepts booking requests from Designers.
- **Model**: A subtype of Marketer who offers physical modeling services for brand adverts.
- **Content_Creator**: A subtype of Marketer who produces digital content (photos, videos) for brand adverts.
- **Auth_Service**: The subsystem responsible for user registration, login, and session management.
- **Dashboard**: The role-specific home screen presented to a user after login.
- **Inspiration_Feed**: The Pinterest-style scrollable feed of outfit inspiration images.
- **Outfit_Generator**: The AI-powered text-to-outfit-concept feature.
- **Designer_Directory**: The searchable and filterable list of Designer profiles available to Clients.
- **Designer_Profile**: The public-facing page displaying a Designer's portfolio, ranking, location, and availability.
- **Appointment_Manager**: The subsystem within the Designer Dashboard for tracking client appointments.
- **Marketer_Directory**: The searchable list of Marketer profiles available to Designers.
- **Vendor_Storefront**: The catalog-based shopping interface for a single Vendor.
- **Marketplace**: The aggregated browsing interface across all Vendor storefronts.
- **Cart**: The temporary container holding items a Client intends to purchase.
- **Order**: A confirmed purchase transaction between a Client and a Vendor.
- **Delivery_System**: The subsystem that coordinates order fulfillment without requiring in-person buyer–vendor contact.
- **Payment_Gateway**: The subsystem that processes MTN Mobile Money and Orange Money transactions.
- **Ranking**: A computed score for Designers based on client reviews and completed appointments.
- **Portfolio**: A collection of images and/or work samples associated with a Designer or Marketer profile.
- **Notification_Service**: The subsystem responsible for in-app and push notifications.
- **Chat_Service**: The real-time messaging subsystem between users.
- **Training_Program**: A structured fashion design course created by a Designer with a defined duration, schedule, price, and enrollment capacity.
- **Training_Badge**: A visual indicator on a Client's profile showing active enrollment in a training program.
- **Training_Application**: A Client's request to enroll in a Training_Program, confirmed by payment.
- **Designer_Planner**: The calendar and scheduling tool within the Designer Dashboard that consolidates training sessions, appointments, and delivery deadlines.
- **Collaboration_Project**: A shared design project created by a Designer to work with other Designers on larger-scale fashion work.
- **Collaboration_Workspace**: The shared space within a Collaboration_Project where participating Designers exchange notes, files, and progress updates.

---

## Requirements

### Requirement 1: User Registration and Onboarding

**User Story:** As a new user, I want to create an account by providing my name, phone number, location, and role, so that I can access a dashboard tailored to my role in the fashion ecosystem.

#### Acceptance Criteria

1. THE Auth_Service SHALL present a registration form collecting: full name (1–100 characters), phone number in E.164 format (e.g., +237XXXXXXXXX), geographic location (city or region, 1–100 characters), and role selection (Client, Designer, Vendor, Marketer).
2. WHEN a user selects the Marketer role during registration, THE Auth_Service SHALL present a sub-role selection requiring the user to choose between Model and Content_Creator before the form can be submitted.
3. WHEN a user submits the registration form with one or more invalid or empty required fields, THE Auth_Service SHALL display an inline error message adjacent to each invalid field and SHALL NOT create an account.
4. IF a phone number provided during registration is already associated with an existing account, THEN THE Auth_Service SHALL display an error message on the phone number field indicating it is already in use and SHALL NOT create a duplicate account.
5. WHEN registration is successfully completed, THE Auth_Service SHALL create the user account and redirect the user to the role-specific Dashboard within 3 seconds.
6. THE Auth_Service SHALL allow a registered user to log in using their phone number and either a password (minimum 8 characters) or a numeric PIN (4–6 digits).
7. WHEN a user logs in successfully, THE Auth_Service SHALL present the Dashboard corresponding to the user's registered role within 3 seconds.
8. IF a login attempt is made with an unrecognized phone number or incorrect credentials, THEN THE Auth_Service SHALL display a generic error message ("Invalid phone number or password") and allow the user to retry.
9. IF a user makes 5 consecutive failed login attempts, THEN THE Auth_Service SHALL lock the account for 15 minutes and display a message informing the user of the lockout duration.
10. WHEN a user logs in successfully and does not explicitly log out, THE Auth_Service SHALL persist the user's session so that subsequent app launches take the user directly to their role-specific Dashboard without requiring re-authentication.
11. WHEN a user who has an active persistent session opens the App, THE App SHALL navigate directly to their role-specific Dashboard within 3 seconds, bypassing the login screen entirely.

---

### Requirement 2: Role-Specific Dashboards

**User Story:** As a registered user, I want to see a dashboard specific to my role after logging in, so that I can immediately access the tools and content most relevant to my activities.

#### Acceptance Criteria

1. WHEN a Client logs in, THE Dashboard SHALL display clearly labeled entry points to the Inspiration_Feed, Designer_Directory, Marketplace, and Chat_Service within 3 seconds of login.
2. WHEN a Designer logs in, THE Dashboard SHALL display clearly labeled entry points to the Appointment_Manager, Portfolio management, Marketer_Directory, and a work summary (completed fits count, pending appointments count) within 3 seconds of login.
3. WHEN a Vendor logs in, THE Dashboard SHALL display clearly labeled entry points to catalog management, active Orders list, and delivery tracking within 3 seconds of login.
4. WHEN a Marketer logs in, THE Dashboard SHALL display the Marketer's Portfolio thumbnail grid, a count of pending booking requests, and a booking history list within 3 seconds of login.
5. THE App SHALL render each Dashboard exclusively using colors from the selected Afrocentric palette (Kente Gold, Sahara Sunset, Congo Royale, Bamileke Earth, or Savanna Bloom), with no entry point or dashboard component rendered in a color outside the defined palette.
6. IF the Dashboard data fails to load within 5 seconds due to a network error, THEN THE App SHALL display an error banner with a "Retry" button and retain the last successfully loaded Dashboard state where available.

---

### Requirement 3: Inspiration Feed

**User Story:** As a Client, I want to scroll through a curated feed of Cameroonian and African outfit inspirations, so that I can discover fashion ideas and connect with designers to bring them to life.

#### Acceptance Criteria

1. THE Inspiration_Feed SHALL display a vertically scrollable collection of outfit inspiration images including both traditional and contemporary Cameroonian and African fashion styles, loading a minimum of 10 items per batch.
2. WHEN a Client taps an inspiration image, THE Inspiration_Feed SHALL display a detail view showing the full image, style tags, and two action buttons: "Send to Designer" and "Generate Outfit".
3. WHEN a Client selects "Send to Designer" on an inspiration image, THE App SHALL present a list of Designers whose registered location matches the Client's location; IF no Designers are found for that location, THE App SHALL display a "No designers available in your area" message.
4. WHEN a Client selects "Generate Outfit" from the Inspiration_Feed, THE Outfit_Generator SHALL display a text input field accepting between 1 and 500 characters describing the desired outfit.
5. IF a Client submits an empty or oversized (>500 characters) prompt to the Outfit_Generator, THEN THE Outfit_Generator SHALL display an inline validation error and SHALL NOT submit the request.
6. WHEN a Client submits a valid text prompt to the Outfit_Generator, THE Outfit_Generator SHALL produce a visual concept or descriptive output within 10 seconds.
7. IF the Outfit_Generator fails to produce a result within 10 seconds, THEN THE Outfit_Generator SHALL display an error message and offer a "Retry" button that resubmits the same prompt without requiring re-entry.
8. WHEN an Outfit_Generator result is produced, THE App SHALL allow the Client to send the generated concept to a selected Designer via Chat_Service or save it to their profile.
9. THE Inspiration_Feed SHALL support infinite scrolling, loading the next batch of at least 10 items as the Client approaches the end of the current list; WHEN no more items are available, THE Feed SHALL display an end-of-feed indicator.

---

### Requirement 4: Designer Discovery

**User Story:** As a Client, I want to browse and search for Designers by location and ranking, so that I can find a skilled and accessible designer to work with.

#### Acceptance Criteria

1. THE Designer_Directory SHALL display a list of Designer profiles each showing: name, location, ranking score (on a 0.0–5.0 scale), and a single Portfolio thumbnail image.
2. WHEN a Client applies a location filter in the Designer_Directory, THE Designer_Directory SHALL return only Designers whose registered location matches the specified area; IF no Designers match, THE Directory SHALL display a "No designers found in this location" message.
3. WHEN a Client applies a ranking filter, THE Designer_Directory SHALL sort Designers in descending order by ranking score; Designers with equal scores SHALL be ordered by most recently active first.
4. WHEN a Client types a search query (1–100 characters) in the Designer_Directory search field, THE Directory SHALL return matching results within 3 seconds based on name or location.
5. WHEN a Client taps a Designer's entry in the Designer_Directory, THE App SHALL navigate to that Designer's Designer_Profile page within 2 seconds.
6. THE Designer_Profile SHALL display: up to 20 Portfolio images, ranking score (0.0–5.0), location, and availability status ("Available", "Busy", or "Unavailable").
7. WHEN a Client taps "Message" on a Designer_Profile, THE Chat_Service SHALL open a new or existing conversation thread between the Client and that Designer.
8. IF a Designer_Profile fails to load, THE App SHALL display an error message and preserve the Client's current filter and search state in the Designer_Directory.

---

### Requirement 5: Designer Profile and Portfolio Management

**User Story:** As a Designer, I want to maintain a public profile with my portfolio and manage my appointment schedule, so that potential clients can evaluate my work and I can stay organized.

#### Acceptance Criteria

1. THE Designer_Profile SHALL allow the Designer to upload Portfolio images in JPEG, PNG, or WEBP format, each no larger than 10 MB, up to a maximum of 50 images total.
2. WHEN a Designer uploads a valid image to their Portfolio, THE App SHALL store the image and display it on the Designer's public Designer_Profile within 5 seconds of upload confirmation.
3. IF a Designer attempts to upload a file in an unsupported format or exceeding 10 MB, THEN THE App SHALL display an error message specifying the violation and SHALL NOT store the file.
4. THE Appointment_Manager SHALL display a list of all appointments categorized as "Pending", "Attended", or "Unattended".
5. WHEN a new appointment request is received from a Client, THE Notification_Service SHALL deliver a push notification to the Designer within 10 seconds.
6. WHEN a Designer marks an appointment as "Attended", THE Appointment_Manager SHALL record the completion timestamp and update the appointment status to "Attended".
7. WHEN a Designer marks an appointment currently in "Attended" status as "Delivered", THE Appointment_Manager SHALL move the record to the Designer's delivered fits history; IF the appointment is not in "Attended" status, THE App SHALL display an error message and SHALL NOT perform the transition.
8. WHEN a Designer taps the availability toggle on their profile, THE Designer_Profile SHALL update the availability status to the opposite value ("Available" ↔ "Unavailable") and reflect the change in the Designer_Directory within 60 seconds.
9. WHEN a Client submits a review score for a Designer, THE Ranking system SHALL recompute the Designer's ranking score as the arithmetic mean of all submitted review scores on a 1–5 scale and update the displayed score within 5 seconds.

---

### Requirement 6: Marketer Profiles and Booking

**User Story:** As a Designer, I want to browse and hire Models or Content Creators for brand advertisements, so that I can promote my work through professional marketers.

#### Acceptance Criteria

1. THE Marketer_Directory SHALL display a list of Marketer profiles filterable by sub-role (Model or Content_Creator) and location, displaying up to 100 profiles per page.
2. THE Marketer_Directory SHALL display each Marketer's name, sub-role, location, and a single Portfolio thumbnail image (max 500 KB, 300×300 px display size).
3. WHEN a Designer taps a Marketer's entry in the Marketer_Directory, THE App SHALL navigate to that Marketer's full profile page within 2 seconds, displaying their complete Portfolio and one of the following booking statuses: "Available", "Booked".
4. WHEN a Designer submits a booking request containing the Designer's name, a description (≤500 characters), and a proposed date range, THE Notification_Service SHALL deliver a push notification with these details to the Marketer within 30 seconds.
5. IF the Notification_Service fails to deliver a booking request notification, THEN THE system SHALL retry delivery up to 3 times at 60-second intervals before marking the notification as "Failed" and logging the error.
6. WHEN a Marketer accepts a booking request, THE App SHALL update the booking status to "Confirmed" and notify the requesting Designer via push notification within 30 seconds.
7. WHEN a Marketer declines a booking request, THE App SHALL update the booking status to "Declined" and notify the requesting Designer via push notification within 30 seconds.
8. THE Marketer Portfolio SHALL support uploading of images (JPEG/PNG, max 10 MB each) and video content (max 200 MB, max 5 minutes duration), up to 50 files total.
9. WHILE a Marketer has an active "Confirmed" booking, THE Marketer_Directory SHALL display that Marketer's status as "Booked" and THE App SHALL prevent new booking requests from being submitted to that Marketer.

---

### Requirement 7: Vendor Storefront and Catalog Management

**User Story:** As a Vendor, I want to upload and manage a catalog of fashion items and services, so that Clients can browse and purchase from me without needing to meet in person.

#### Acceptance Criteria

1. THE Vendor_Storefront SHALL allow Vendors to create catalog listings with: item name (1–100 characters), category (clothes, accessories, shoes, or hairstyle products/services), description (1–1000 characters), price (0.01–999,999.99 XAF), and 1–10 images (each max 5 MB).
2. IF a Vendor submits a catalog listing with any required field missing, out-of-range, or with an image exceeding 5 MB, THEN THE Vendor_Storefront SHALL display an inline error on the offending field and SHALL NOT save the listing.
3. WHEN a Vendor publishes a valid catalog listing, THE Marketplace SHALL make the listing visible to all Clients within 60 seconds.
4. WHEN a Vendor updates the price or availability of a listing, THE Marketplace SHALL reflect the change within 60 seconds.
5. WHEN a Vendor marks a listing as "Out of Stock", THE Marketplace SHALL display the listing with an "Out of Stock" indicator and prevent Clients from adding it to the Cart.
6. WHEN a Vendor marks an "Out of Stock" listing as available again, THE Marketplace SHALL remove the "Out of Stock" indicator and re-enable the "Add to Cart" action within 60 seconds.
7. THE Vendor_Storefront SHALL allow Vendors to view a list of all active Orders showing: buyer display name, ordered item names, quantities, total price, and current delivery status.

---

### Requirement 8: Client Marketplace and Purchasing

**User Story:** As a Client, I want to browse vendor catalogs and purchase fashion items with delivery, so that I can shop for fashion products without meeting vendors in person.

#### Acceptance Criteria

1. THE Marketplace SHALL display catalog listings from all Vendors showing at minimum: item name, price, and a thumbnail image; listings SHALL be filterable by category and Vendor location.
2. WHEN a Client taps a listing in the Marketplace, THE App SHALL display the item detail view within 3 seconds, showing: name, description, price, up to 10 images, and Vendor information.
3. WHEN a Client taps "Add to Cart" on an available item, THE Cart SHALL add the item within 1 second and display the updated count of distinct items in the Cart.
4. IF a Client attempts to add an "Out of Stock" item to the Cart, THEN THE App SHALL display an "Item unavailable" message and SHALL NOT add the item.
5. WHEN a Client proceeds to checkout, THE App SHALL display an order summary containing: item names, quantities, unit prices, subtotal, and delivery fee; THE App SHALL then prompt the Client to select a payment method (MTN Mobile Money or Orange Money).
6. WHEN a Client confirms an Order, THE Payment_Gateway SHALL initiate the payment transaction within 5 seconds.
7. WHEN the Payment_Gateway confirms a successful transaction, THE App SHALL create an Order record, notify the Vendor via the Notification_Service within 30 seconds, and display an order confirmation to the Client showing the Order reference number and estimated delivery date.
8. IF the Payment_Gateway returns a payment failure, THEN THE App SHALL display an error message with the failure reason, preserve the Cart contents, and allow the Client to retry or select a different payment method.
9. WHEN an Order is confirmed, THE Delivery_System SHALL assign a delivery tracking reference within 60 seconds and display the current delivery status to the Client on the order detail screen, using statuses: "Pending", "In Transit", or "Delivered".

---

### Requirement 9: Payment Integration

**User Story:** As a user, I want to pay for purchases using MTN Mobile Money or Orange Money, so that I can complete transactions using the payment methods common in Cameroon.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL support MTN Mobile Money (MTN MoMo) as a payment method for all purchase transactions on the platform.
2. THE Payment_Gateway SHALL support Orange Money (OM) as a payment method for all purchase transactions on the platform.
3. WHEN a payment is initiated, THE Payment_Gateway SHALL send the transaction request to the selected provider's API within 5 seconds and await a response for a maximum of 30 seconds.
4. WHEN a payment is confirmed by the provider, THE Payment_Gateway SHALL record the transaction reference, amount, provider, and timestamp within 5 seconds of receiving confirmation.
5. IF the payment provider API returns no response within 30 seconds or returns an explicit unreachable error, THEN THE Payment_Gateway SHALL roll back the associated Order to a "Pending" state, return an error to the App, and SHALL NOT deduct funds from the user's account.
6. IF a payment provider returns an explicit failure response, THEN THE Payment_Gateway SHALL return the failure reason to the App and SHALL NOT deduct funds from the user's account.
7. THE Payment_Gateway SHALL reject any transaction where the amount is outside the range of 1–10,000,000 XAF before contacting the provider API, and SHALL return a validation error to the App.
8. THE Payment_Gateway SHALL transmit all payment requests over a TLS-encrypted connection.

---

### Requirement 10: Real-Time Messaging

**User Story:** As a Client or Designer, I want to send and receive messages in real time, so that we can coordinate on designs, appointments, and inspiration concepts without leaving the app.

#### Acceptance Criteria

1. THE Chat_Service SHALL allow any Client to initiate a conversation with any Designer visible in the Designer_Directory.
2. WHEN a message is sent by either party under normal network conditions (≤150ms RTT, <1% packet loss), THE Chat_Service SHALL deliver the message to the recipient's device within 3 seconds.
3. IF message delivery fails, THE Chat_Service SHALL retry up to 3 times at 5-second intervals; IF all retries fail, THE Chat_Service SHALL display a "Message not delivered" indicator on the failed message.
4. THE Chat_Service SHALL support sending text messages (max 2000 characters) and image attachments (max 10 MB each); IF a text message exceeds 2000 characters or an image exceeds 10 MB, THE App SHALL display a validation error and SHALL NOT send the message.
5. WHEN a user receives a new message while the App is in the background, THE Notification_Service SHALL deliver a push notification containing the sender's name and a preview of up to 100 characters of the message.
6. THE Chat_Service SHALL display a read receipt indicator that transitions from "Delivered" to "Read" within 3 seconds of the recipient opening the message.
7. THE Chat_Service SHALL persist all conversation history in chronological order with timestamps accurate to the minute, and make it accessible to both parties upon reopening the conversation thread.

---

### Requirement 11: Notifications

**User Story:** As a user, I want to receive timely notifications about activity relevant to my role, so that I can respond to appointments, orders, messages, and booking requests promptly.

#### Acceptance Criteria

1. THE Notification_Service SHALL deliver push notifications to users whose devices are not actively running the App in the foreground within 30 seconds of the triggering event.
2. WHEN the App is in the foreground, THE Notification_Service SHALL display in-app notification banners within 3 seconds of the triggering event, remaining visible for at least 4 seconds before auto-dismissing.
3. WHEN a new appointment request is received from a Client, THE Notification_Service SHALL notify the Designer including the Client's name and the requested appointment date and time.
4. WHEN a Designer updates the status of an appointment, THE Notification_Service SHALL notify the Client including the new appointment status and the Designer's name.
5. WHEN a new Order is placed for an item in their catalog, THE Notification_Service SHALL notify the Vendor including the Order ID and the ordered item name.
6. WHEN the delivery status of an Order is updated, THE Notification_Service SHALL notify the Client including the new delivery status and the Order ID.
7. WHEN a Designer sends a booking request, THE Notification_Service SHALL notify the Marketer including the Designer's name and the proposed booking date range.
8. WHEN a Marketer accepts or declines a booking request, THE Notification_Service SHALL notify the Designer including the Marketer's name and their decision ("Confirmed" or "Declined").
9. WHEN a user taps a notification, THE App SHALL navigate to the relevant screen within 2 seconds.
10. IF a user has denied push notification permissions for the App, THEN THE Notification_Service SHALL display all notifications as in-app banners only and SHALL NOT attempt to send push notifications.

---

### Requirement 12: UI and Accessibility

**User Story:** As a user, I want the app to feel culturally resonant and be easy to use on any device, so that I have a seamless and authentic experience reflecting Cameroonian fashion culture.

#### Acceptance Criteria

1. THE App SHALL apply the selected Afrocentric color palette as the primary visual theme such that at least 80% of all UI surfaces use colors exclusively from the chosen palette (Kente Gold, Sahara Sunset, Congo Royale, Bamileke Earth, or Savanna Bloom).
2. THE App SHALL render without layout defects (overflow, misalignment, or text truncation) on screen widths between 320pt and 428pt on both Android and iOS.
3. THE App SHALL translate 100% of user-visible strings — including labels, error messages, placeholders, and button text — into both English and French.
4. WHEN a user changes the language preference in App settings, THE App SHALL reload all UI text in the selected language within 2 seconds without requiring a full application restart.
5. IF the language resource file for the selected language is unavailable or corrupt, THEN THE App SHALL retain the previously active language and display an error message informing the user that the language could not be loaded.
6. WHEN the App is launched for the first time, THE App SHALL default to the device's system language if it is English or French; OTHERWISE THE App SHALL default to English.
7. THE App SHALL maintain a minimum touch target size of 44×44 points for all interactive elements including buttons, links, checkboxes, and form inputs.
8. THE App SHALL provide a non-empty descriptive accessibility label, distinct from any visual placeholder text, on every interactive and informational UI element to support screen reader tools on both Android and iOS.

---

### Requirement 13: Guest Mode

**User Story:** As a visitor who has not signed in, I want to browse outfit inspirations and vendor products without creating an account, so that I can explore the app before deciding to register.

#### Acceptance Criteria

1. WHEN a user opens the App without an active session and does not sign in or sign up, THE App SHALL display a guest-accessible version of the Client Dashboard without requiring authentication.
2. THE guest Dashboard SHALL provide access to the Inspiration_Feed (browsing only) and the Marketplace (browsing only), and SHALL NOT display entry points to the Outfit_Generator, Chat_Service, Designer_Directory, or any booking features.
3. WHEN a guest user browses the Inspiration_Feed, THE App SHALL display both traditional and non-traditional outfit inspirations in read-only mode with no "Send to Designer" or "Generate Outfit" actions available.
4. WHEN a guest user browses the Marketplace, THE App SHALL display vendor product listings in read-only mode; the "Add to Cart" and checkout actions SHALL NOT be available to guest users.
5. WHEN a guest user attempts to access a restricted feature (messaging, outfit generation, booking, purchasing), THE App SHALL display a prompt inviting the user to sign in or create an account, with buttons linking to the login and registration screens.
6. THE App SHALL display a persistent but non-intrusive "Sign In / Sign Up" banner or button on the guest Dashboard to encourage registration without blocking content browsing.
7. WHEN a guest user taps "Sign In" or "Sign Up" and successfully authenticates, THE App SHALL transition them to the appropriate role-specific Dashboard and restore the Inspiration_Feed scroll position if they were previously browsing it.

---

### Requirement 14: Designer Training Programs

**User Story:** As a Designer, I want to create training programs with defined schedules and fees, so that Clients can enroll in structured fashion design courses and I can grow a teaching revenue stream.

#### Acceptance Criteria

1. THE App SHALL allow a Designer to create a Training_Program by providing: title (1–150 characters), description (1–2000 characters), duration category ("short-term" for 3–6 months or "long-term" for 1–2 years), start date (a calendar date not earlier than the submission date), maximum enrollment capacity (integer 1–500), price in XAF (range 1–10,000,000), and a training schedule/timetable (1–5000 characters describing sessions and timing).
2. IF a Designer submits a Training_Program with any required field missing, out-of-range, or with a start date earlier than the submission date, THEN THE App SHALL display an inline error on each offending field and SHALL NOT save the Training_Program.
3. WHEN a Designer publishes a valid Training_Program, THE App SHALL make the Training_Program visible on the Designer's public Designer_Profile within 60 seconds.
4. THE App SHALL display all published Training_Programs on the Designer's Designer_Profile, showing for each: title, duration category, start date, price in XAF, and remaining enrollment slots (capacity minus accepted applicants).
5. WHEN a Client browses Training_Programs, THE App SHALL allow the Client to filter Training_Programs by duration category ("short-term" or "long-term") and by the Designer's registered location.
6. WHEN a Client selects a Training_Program to apply, THE Payment_Gateway SHALL initiate a payment transaction for the Training_Program price using MTN Mobile Money or Orange Money before the Training_Application is recorded.
7. WHEN the Payment_Gateway confirms a successful transaction for a Training_Application, THE App SHALL create a Training_Application record with status "Pending" and notify the Designer via the Notification_Service within 30 seconds.
8. IF the Payment_Gateway returns a payment failure for a Training_Application, THEN THE App SHALL display the failure reason to the Client and SHALL NOT create a Training_Application record.
9. WHEN a Designer accepts a Training_Application, THE App SHALL update the Training_Application status to "Accepted", decrement the Training_Program's remaining enrollment slots by one, and notify the Client via the Notification_Service within 30 seconds.
10. WHEN a Designer rejects a Training_Application, THE App SHALL update the Training_Application status to "Rejected" and notify the Client via the Notification_Service within 30 seconds.
11. WHEN a Training_Application status transitions to "Accepted", THE App SHALL display a Training_Badge on the Client's profile indicating active enrollment in the corresponding Training_Program.
12. IF a Designer attempts to accept a Training_Application when the Training_Program's remaining enrollment slots are zero, THEN THE App SHALL display an error message and SHALL NOT update the Training_Application status.
13. WHEN a Designer updates the training schedule/timetable of an existing Training_Program, THE App SHALL reflect the updated timetable on the Designer's public Designer_Profile within 60 seconds and notify all Clients with an "Accepted" Training_Application for that program via the Notification_Service within 30 seconds.
14. THE App SHALL allow a Designer to view all Training_Applications for each of their Training_Programs, displaying for each application: applicant Client name, application status ("Pending", "Accepted", or "Rejected"), and payment confirmation reference.

---

### Requirement 15: Designer Planner

**User Story:** As a Designer, I want a built-in planner that shows my training sessions, appointments, and delivery deadlines in one view, so that I can manage my workload and avoid overbooking.

#### Acceptance Criteria

1. THE Designer_Planner SHALL display a calendar view consolidating, for each day: all active Training_Program sessions derived from timetables of Training_Programs the Designer has published, all appointments categorized as "Pending" or "Attended", and all appointments with a status of "Attended" that have not yet been marked "Delivered" (representing outstanding delivery deadlines).
2. WHEN a Designer opens the Designer_Planner, THE App SHALL render the consolidated calendar view within 3 seconds, showing all events for at least the next 30 days from the current date.
3. WHILE a Designer has at least one Training_Program session and at least one appointment or delivery deadline scheduled on the same calendar day, THE Designer_Planner SHALL display a visual conflict indicator on that day to signal a potential scheduling conflict.
4. THE Designer_Planner SHALL display a capacity summary for any selected day showing: the count of Training_Program sessions scheduled, the count of Pending and Attended appointments, and the count of outstanding delivery deadlines.
5. WHEN a Designer adds a custom event to the Designer_Planner by providing an event title (1–200 characters) and a date, THE App SHALL display the custom event on the corresponding day in the planner within 5 seconds and persist it for future planner views.
6. IF a Designer submits a custom event with an empty title or no date selected, THEN THE App SHALL display an inline validation error and SHALL NOT save the custom event.
7. WHEN a Designer adds a custom note to a specific day in the Designer_Planner (1–1000 characters), THE App SHALL persist the note and display it when the Designer views that day's detail, within 5 seconds of saving.
8. THE Designer_Planner SHALL remain accessible to the Designer at all times from the Designer Dashboard via a clearly labeled entry point.

---

### Requirement 16: Designer Collaboration

**User Story:** As a Designer, I want to create and join collaboration projects with other Designers, so that we can work together on larger-scale fashion work and showcase joint projects in our portfolios.

#### Acceptance Criteria

1. THE App SHALL allow a Designer to create a Collaboration_Project by providing: title (1–150 characters), description (1–2000 characters), a list of required skills or roles (1–500 characters), a deadline (a calendar date not earlier than the creation date), and a collaborator slots count (integer 1–20).
2. IF a Designer submits a Collaboration_Project with any required field missing, out-of-range, or with a deadline earlier than the creation date, THEN THE App SHALL display an inline error on each offending field and SHALL NOT save the Collaboration_Project.
3. WHEN a Designer publishes a valid Collaboration_Project, THE App SHALL display the Collaboration_Project on the creating Designer's public Designer_Profile as a portfolio item within 60 seconds.
4. WHEN a Designer sends a collaboration invitation to another Designer by selecting a target Designer and a published Collaboration_Project, THE Notification_Service SHALL deliver an invitation notification to the invited Designer within 30 seconds, containing the inviting Designer's name, the Collaboration_Project title, and the required skills or roles.
5. WHEN an invited Designer accepts a collaboration invitation, THE App SHALL add the invited Designer to the Collaboration_Project's participant list, decrement the collaborator slots count by one, and notify the inviting Designer via the Notification_Service within 30 seconds.
6. WHEN an invited Designer declines a collaboration invitation, THE App SHALL update the invitation status to "Declined" and notify the inviting Designer via the Notification_Service within 30 seconds.
7. IF a Designer attempts to send a collaboration invitation for a Collaboration_Project whose collaborator slots count has reached zero, THEN THE App SHALL display an error message and SHALL NOT send the invitation.
8. WHILE a Designer is a participant in a Collaboration_Project, THE App SHALL provide access to the project's Collaboration_Workspace, which SHALL support: adding and viewing shared text notes (each 1–2000 characters), uploading shared files (JPEG, PNG, WEBP, or PDF; each ≤ 10 MB; maximum 50 files per project), and posting progress updates (1–1000 characters each).
9. WHEN a participant Designer posts a progress update or uploads a file to the Collaboration_Workspace, THE Notification_Service SHALL notify all other participants of the Collaboration_Project within 30 seconds, including the posting Designer's name and a summary of the update.
10. WHEN a Collaboration_Project's deadline passes, THE App SHALL mark the project status as "Completed" and retain the Collaboration_Project on all participant Designers' public Designer_Profiles as a portfolio item.
11. THE App SHALL display all Collaboration_Projects in which a Designer participates on that Designer's public Designer_Profile, showing for each: project title, participant Designer names, deadline, and project status ("Active" or "Completed").
