# BloodBank+ - Online Blood Banking System

A modern, secure, and user-friendly blood banking platform built with React.js and Supabase. This system connects blood donors, recipients, hospitals, and blood banks to streamline donations, requests, and inventory management.

## 🩸 Features

### Core Functionality
- **Multi-role Authentication**: Support for donors, recipients, blood banks, and administrators
- **Real-time Blood Inventory**: Live tracking of blood availability across multiple blood banks
- **Donation Scheduling**: Easy appointment booking for blood donors
- **Blood Request Management**: Streamlined process for hospitals and patients to request blood
- **Advanced Search**: Find blood banks and check availability by location and blood type
- **Real-time Notifications**: Instant alerts for new requests, low stock, and important updates

### User Experience
- **Modern Design**: Clean, healthcare-appropriate interface with medical color scheme
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Dark Mode Support**: User preference-based theme switching
- **Accessibility**: ARIA labels, keyboard navigation, and high contrast support
- **Smooth Animations**: Subtle transitions and micro-interactions using Framer Motion

### Security & Reliability
- **Secure Authentication**: Email/password with role-based access control
- **Row Level Security**: Database-level security policies in Supabase
- **Real-time Updates**: Live data synchronization across all users
- **Error Handling**: Comprehensive error management with user-friendly messages

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, utility-first styling
- **Framer Motion** for smooth animations
- **React Router** for client-side routing
- **React Hot Toast** for notifications
- **Heroicons** for consistent iconography

### Backend & Database
- **Supabase** for backend services, authentication, and PostgreSQL database
- **Real-time subscriptions** for live data updates
- **Row Level Security (RLS)** for data protection

### Development Tools
- **Vite** for fast development and building
- **ESLint** for code quality
- **TypeScript** for type safety
- **PostCSS** with Autoprefixer

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blood-banking-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Run the SQL commands provided in the setup guide to create tables
   - Enable Row Level Security on all tables

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Tables
- **users**: User profiles with role-based access
- **blood_inventory**: Blood stock tracking with expiry dates
- **blood_requests**: Request management with status tracking
- **donation_history**: Complete donation records
- **notifications**: Real-time alert system

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Secure API endpoints

## 👥 User Roles

### Donor
- Register and manage profile
- Schedule donation appointments
- View donation history
- Receive notifications for donation reminders

### Recipient/Hospital
- Search for available blood
- Submit blood requests
- Track request status
- Emergency contact system

### Blood Bank
- Manage blood inventory
- Process donation appointments
- Approve/reject blood requests
- Monitor stock levels and expiry dates

### Administrator
- System-wide oversight
- User management
- Analytics and reporting
- System configuration

## 🎨 Design System

### Color Palette
- **Primary Red**: #DC2626 (medical/emergency theme)
- **Secondary Blue**: #2563EB (trust and reliability)
- **Success Green**: #059669 (positive actions)
- **Warning Orange**: #D97706 (alerts and cautions)
- **Neutral Grays**: Multiple shades for backgrounds and text

### Typography
- **Font Family**: Inter (modern, readable sans-serif)
- **Font Weights**: 300-800 (light to extra bold)
- **Line Heights**: 120% for headings, 150% for body text

### Components
- Consistent spacing system (8px grid)
- Rounded corners and subtle shadows
- Hover states and focus indicators
- Loading states and error handling

## 🔒 Security Features

- **Authentication**: Secure email/password with Supabase Auth
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security policies
- **Input Validation**: Client and server-side validation
- **HTTPS**: Secure data transmission

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Appropriate tap targets and gestures

## 🚀 Deployment

The application can be deployed to various platforms:

### Recommended Platforms
- **Frontend**: Vercel, Netlify, or similar
- **Backend**: Supabase (handles backend automatically)

### Build for Production
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Emergency Blood Hotline: 1-800-BLOOD
- Technical Support: Create an issue in the repository
- Documentation: Check the inline code comments and README

## 🙏 Acknowledgments

- Icons by Heroicons
- Fonts by Google Fonts (Inter)
- Backend by Supabase
- Built with love for saving lives 💝

---

**Made with ❤️ for humanity**