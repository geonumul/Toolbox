import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { IntroLoader } from './components/IntroLoader';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Recruitment } from './components/Recruitment';
import { PaymentSuccess } from './components/PaymentSuccess';
import { InboxModal } from './components/ui/InboxModal';

// Firebase
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Pages
import { GalleryPage } from './components/pages/GalleryPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { StudyPage } from './components/pages/StudyPage';
import { TeamPage } from './components/pages/TeamPage';
import { ArchivePage } from './components/pages/ArchivePage';
import { AdminPage } from './components/pages/AdminPage';

// Data Hook
import { useData } from './utils/data';

function App() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const { data, updateData, updateConfig } = useData();

  const [isInboxOpen, setIsInboxOpen] = useState(false);

  // Firestore Data State
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);

  // Fetch Projects from Firestore
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const fetchedProjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error fetching projects: ", error);
        // Fallback to local data if firestore fails
        setProjects([]); 
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Styling override
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  // Check URL for admin route
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setPage('admin');
    }
  }, []);

  const handleUpdateConfig = (key: string, value: string) => {
    updateConfig({ [key]: value });
  };

  const handleApply = (application: any) => {
      const newApp = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          status: 'unread',
          ...application
      };
      // Add to inbox
      const currentInbox = data.inbox || [];
      updateData('inbox', [newApp, ...currentInbox]);
  };

  const handleDeleteApplication = (id: number) => {
      const currentInbox = data.inbox || [];
      updateData('inbox', currentInbox.filter((app: any) => app.id !== id));
  };

  const renderPage = () => {
    switch(page) {
      case 'gallery':
        return <GalleryPage 
          data={projects.length > 0 ? projects : data.gallery} 
          initialTab="Projects" 
          teamData={data.team} 
          updateData={updateData} 
          isEditing={isEditing} 
        />;
      case 'activities': 
        return <GalleryPage 
          data={projects.length > 0 ? projects : data.gallery} 
          initialTab="Activities" 
          teamData={data.team} 
          updateData={updateData} 
          isEditing={isEditing} 
        />;
      case 'schedule':
        return <SchedulePage data={data.schedule} updateData={updateData} isEditing={isEditing} />;
      case 'study':
        return <StudyPage data={data.study} updateData={updateData} isEditing={isEditing} />;
      case 'team': 
        return <TeamPage data={data.team} updateData={updateData} isEditing={isEditing} />;
      case 'archive':
        return <ArchivePage data={data.archive} updateData={updateData} isEditing={isEditing} />;
      case 'admin':
        return <AdminPage teamData={data.team} />;
      case 'success':
        return <PaymentSuccess onGoHome={() => setPage('home')} onViewOrder={() => setPage('gallery')} />;
      default:
        return (
            <main>
                <Hero />
                <Marquee />
                <Recruitment data={data.recruitment} updateData={updateData} isEditing={isEditing} />
            </main>
        );
    }
  };

  return (
    <>
      <div className="min-h-screen font-sans bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <AnimatePresence mode="wait">
          {loading && <IntroLoader onComplete={() => setLoading(false)} />}
        </AnimatePresence>

        {!loading && (
          <>
              <Header 
                  currentPage={page} 
                  setPage={setPage} 
                  liveLink={data.config?.liveStudioLink || '#'} 
                  googleMeetLink={data.config?.googleMeetLink}
                  slackLink={data.config?.slackLink}
                  toggleEditMode={() => setIsEditing(!isEditing)}
                  isEditing={isEditing}
                  updateConfig={updateConfig}
                  onOpenInbox={() => setIsInboxOpen(true)}
                  inboxCount={(data.inbox || []).length}
              />
              
              <AnimatePresence mode="wait">
                  <motion.div
                      key={page}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                  >
                      {renderPage()}
                  </motion.div>
              </AnimatePresence>
              
              <Footer 
                isEditing={isEditing} 
                onUpdateConfig={handleUpdateConfig}
                config={data.config}
                onApply={handleApply}
              />

              <InboxModal 
                  isOpen={isInboxOpen}
                  onClose={() => setIsInboxOpen(false)}
                  applications={data.inbox || []}
                  onDelete={handleDeleteApplication}
              />
          </>
        )}
      </div>
    </>
  );
}

export default App;
