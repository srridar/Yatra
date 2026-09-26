# Yatra
This is a multi service provider riding sharing web application.

## Features

- User registrtion for multiple roles: Rider, Delivery Partner, Bus/Truck Provider
- Login/Register system with role-based access
- Admin dashboard
- Ride request logic
- Responsive UI (mobile-first design)

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Node.js, Express, Typescript
- **Database:** MongoB (via MongoDB Atlas)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
1. Clone the repository
git clone https://github.com/bibekpandey999/Yatra.git 
cd Yatra

2. Install frontend dependencies:
cd frontend
npm install

3. Install backend dependencies
cd backend 
npm install

4. Setup environment variables:
- Create a `.env` file inside `backend/` folder
-Add: MONGODB_URI=your_mongodb_connection_string

### Running the project

**Frontend:**
cd frontend
npm run dev

Runs on `http://localhost:3000`

**Backend:**
cd backend
npm run dev

## Project Structure

Yatra/
├── backend/ # Express API + MongoDB
├── frontend/ # Next.js app

## Contributors
- Shreejal Shrestha
- Sushil Bhattarai



## first week report

- we have implemented basic and core logic of application like register, login, logout . some of the logic are connected with frontend as also working
- we also create some of the core function that admin , transporter(rider,booking provider) and passenger performs.

admin

-  we have create admin dashboard , password change ui, view pending kyc , view all customers, edit profile, some of them are connected with backend
-  most of the logic is implemented in backend along with routing but not connected with frontend
-  backend logic for admin created till now: this logic are implemented for admin (only backend code not it's frontend)

registerAdmin, loginAdmin, logout, getAdminProfile, updateProfile, changeAdminPassword, getAllTransporters, 
getTransportProviderById, verifyTransportProviderKYC rejectTransportProviderKYC, deleteTransportProvider, blockUnBlockTransportProvide, getPendingKYCProviders ,
getBlockedTransportProviders, getAllCustomers, getCustomerById, blockUnBlockCustomer, deleteCustomer, getRideById, getActiveRides,
viewRideDetails, getCancelRidesById , getCanceledRides, getCompletedRides,
getDashboardStats

passenger

- Fronted is that much not implemented for passenger yet only 

- main page where customer(passenger) finds riders is partially implemented  but not working because a lot of functionality are not implemented
- backend logic for passenger created till now :

registerCustomer, loginUser, logout, getCustomerProfile, changeCustomerPassword, updateCustomerProfile, requestRide, cancelRideRequest,
getRideRequestStatus, getMatchedTransporter, getCurrentRide, cancelRide, getRideStatus


transporter(rider)

-  Frontend portion for transporter is not created at only backend is implemented yet.  

-  basic backend logic is implemented like transporter but other core functionalities are not implemented yet 
- backend logic for passenger created till now :
 
  register, login, logout, getProfile, updateAvailablity  


## Next Steps

- In next week, we will work on main core functionality of each user(admin, transporter/rider and passenger)
- we will work on  automatic rideRequest dispatch algorithm by finding rider within 1-5km range and sending rideRequest to each and who accepts 
  then creating final ride.


Note: Frontend is implemented less as compare to backend . so there is not that much in frontend side in this week 





## Second Week Report

During the second week, we fixed several UI issues, mainly related to the Admin and Transporter sections that were identified during the first week.

### Admin Features

In the second week, the Admin section was improved with the following features:

1. Admin can fetch and view their profile and update/edit their profile information.
2. Admin can change their password.
3. Admin can view Transporters and Customers.
4. Admin can log out.

### Transporter Features

The Transporter section now includes the following features:

1. Transporter can fetch and view their profile and update/edit their profile information.
2. Transporter can change their password.
3. Transporter can fill out and submit the KYC form.

### Passenger Features

The Passenger section now includes the following features:

1. Passenger can select their current location and destination.
2. Passenger can find the route between the current location and destination.
3. Passenger can view the distance and estimated fare for different types of vehicles, such as cars, bikes, EVs, etc.

### Backend Logic

We also implemented the backend logic for passenger ride requests.

When a passenger selects their current location and destination and searches for a ride, the system identifies the five nearest transporters and sends them ride request notifications using Socket.IO.

If a transporter accepts the ride request, a ride is created and the transporter who accepts the request first is assigned to that ride.

We have also implemented some of the Socket.IO logic required to provide real-time updates during the ride.

## Next Week

Next week, we will mainly focus on completing approximately 70–80% of the passenger ride request flow and the transporter ride acceptance process.
