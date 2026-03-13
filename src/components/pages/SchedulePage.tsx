import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { EditableField } from '../ui/EditableField';
import { db } from '../../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface SchedulePageProps {
    data: any[];
    updateData?: (section: string, newData: any) => void;
    isEditing?: boolean;
}

export const SchedulePage = ({ data, updateData, isEditing = false }: SchedulePageProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [highlightedEventId, setHighlightedEventId] = useState<string | number | null>(null);

  const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); 
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Real today check
  const today = new Date();
  const isTodayDate = (day: number) => {
      return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const nextUpEvent = [...data]
      .filter(e => new Date(e.date) >= todayMidnight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;

  const displayEvents = [
      ...(nextUpEvent ? [nextUpEvent] : []),
      ...[...data]
          .filter(e => e.id !== nextUpEvent?.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  ];

  const sortedEvents = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getEventsForDay = (day: number) => {
    return sortedEvents.filter(e => {
        const d = new Date(e.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const handleDateClick = (day: number) => {
      const newSelectedDate = new Date(year, month, day);
      setSelectedDate(newSelectedDate);

      const events = getEventsForDay(day);
      if (events.length > 0) {
          const firstEvent = events[0];
          setHighlightedEventId(firstEvent.id);
          
          const element = eventRefs.current[firstEvent.id];
          if (element) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      } else {
          setHighlightedEventId(null);
      }
  };

  const handleEventClick = (event: any) => {
      setHighlightedEventId(event.id);
      const eventDate = new Date(event.date);
      setSelectedDate(eventDate);
      if (eventDate.getMonth() !== month || eventDate.getFullYear() !== year) {
          setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
      }
  };

  // Firestore update
  const handleUpdateEvent = async (id: string | number, field: string, value: string) => {
      if (typeof id === 'string') {
          try {
              const eventRef = doc(db, "schedules", id);
              await updateDoc(eventRef, { [field]: value });
          } catch (error) {
              console.error("Error updating schedule: ", error);
          }
      } else {
          // Fallback for local data
          if (!updateData) return;
          const updated = data.map(ev => ev.id === id ? { ...ev, [field]: value } : ev);
          updateData('schedule', updated);
      }
  };

  // Firestore add
  const handleAddEvent = async () => {
      try {
          await addDoc(collection(db, "schedules"), {
              date: new Date().toISOString().split('T')[0],
              title: "New Event",
              description: "Event description...",
              time: "10:00 AM",
              location: "Online",
              createdAt: new Date()
          });
      } catch (error) {
          console.error("Error adding schedule: ", error);
          alert("Failed to add event: " + error);
      }
  };

  // Firestore delete
  const handleDeleteEvent = async (id: string | number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Delete this event?")) {
          if (typeof id === 'string') {
              try {
                  await deleteDoc(doc(db, "schedules", id));
              } catch (error) {
                  console.error("Error deleting schedule: ", error);
                  alert("Failed to delete event: " + error);
              }
          } else {
              if (!updateData) return;
              updateData('schedule', data.filter(ev => ev.id !== id));
          }
      }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-32 px-6 pb-24 font-sans text-foreground"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-20">
            
            {/* Left Column: Calendar (Sticky) */}
            <div className="lg:w-[320px] flex-shrink-0">
                <div className="sticky top-32">
                    <div className="mb-10 pb-10 border-b border-border">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-semibold tracking-wide text-foreground">
                                {monthNames[month]} {year}
                            </span>
                            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-8">
                            {weekDays.map(d => (
                                <div key={d} className="text-[11px] text-muted-foreground font-normal">{d}</div>
                            ))}
                            
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const events = getEventsForDay(day);
                                const hasEvent = events.length > 0;
                                const isSelected = selectedDate && 
                                                   selectedDate.getDate() === day && 
                                                   selectedDate.getMonth() === month && 
                                                   selectedDate.getFullYear() === year;
                                const isToday = isTodayDate(day);

                                return (
                                    <div 
                                        key={day} 
                                        onClick={() => handleDateClick(day)}
                                        className="relative flex flex-col items-center justify-center cursor-pointer h-9 w-9 mx-auto"
                                    >
                                        <span className={`w-9 h-9 flex items-center justify-center rounded-[4px] text-sm transition-all duration-200 border border-transparent
                                            ${isSelected ? 'bg-muted text-primary font-bold' : 
                                              'text-muted-foreground hover:bg-accent'}
                                            ${isToday && !isSelected ? '!border-gray-300' : ''}
                                        `}>
                                            {day}
                                        </span>
                                        {(hasEvent || isToday) && !isSelected && (
                                            <div className="absolute bottom-1 w-0.5 h-0.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {nextUpEvent && (
                        <div>
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-6">Next Up</h3>
                            <div 
                                className="group cursor-pointer"
                                onClick={() => handleEventClick(nextUpEvent)}
                            >
                                <div className="mb-1">
                                    <span className="text-sm font-bold text-foreground block mb-1">{nextUpEvent.title}</span>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono">
                                        {nextUpEvent.location || "Google Meet"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Schedule List */}
            <div className="flex-1 min-w-0">
                <div className="mb-12 flex items-center justify-between">
                    <h1 className="text-2xl text-foreground">Schedule</h1>
                    {isEditing && (
                        <button 
                            onClick={handleAddEvent}
                            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-800"
                        >
                            <Plus size={14} /> Add Event
                        </button>
                    )}
                </div>
                
                <div className="space-y-0">
                    {displayEvents.map((event, idx) => {
                        const d = new Date(event.date);
                        const dayNum = d.getDate();
                        const weekDay = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(d);
                        const isComingUp = nextUpEvent && event.id === nextUpEvent.id;
                        const isHighlighted = highlightedEventId === event.id;

                        return (
                            <motion.div 
                                key={event.id}
                                ref={el => eventRefs.current[event.id] = el}
                                initial={false}
                                animate={{
                                    backgroundColor: isHighlighted ? 'var(--accent)' : 'transparent'
                                }}
                                onClick={() => handleEventClick(event)}
                                className={`relative flex gap-8 md:gap-12 py-10 border-t border-border last:border-b transition-colors cursor-pointer group hover:bg-muted/30 -mx-6 px-6`}
                            >
                                {isEditing && (
                                    <button 
                                        onClick={(e) => handleDeleteEvent(event.id, e)}
                                        className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}

                                <div className="flex flex-col w-20 flex-shrink-0 pt-1">
                                    <span className="text-3xl font-light leading-none tracking-tight text-foreground mb-1">
                                         {dayNum}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-light">{weekDay}</span>
                                    {isEditing ? (
                                        <div className="mt-2">
                                            <input 
                                                type="date" 
                                                value={event.date}
                                                onChange={(e) => handleUpdateEvent(event.id, 'date', e.target.value)}
                                                className="w-full text-[10px] bg-transparent border border-gray-200 rounded p-1"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground/50 font-mono mt-2">{d.getFullYear()}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-medium text-foreground w-full">
                                            <EditableField 
                                                value={event.title}
                                                onSave={(val) => handleUpdateEvent(event.id, 'title', val)}
                                                isEditing={isEditing}
                                                className="underline decoration-1 underline-offset-4 decoration-border group-hover:decoration-primary"
                                            />
                                        </h3>
                                        {isComingUp && (
                                            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider flex-shrink-0">
                                                Coming Up
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="text-sm text-muted-foreground font-light mb-4 max-w-lg leading-relaxed">
                                        <EditableField 
                                            value={event.description}
                                            onSave={(val) => handleUpdateEvent(event.id, 'description', val)}
                                            isEditing={isEditing}
                                            multiline={true}
                                        />
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground uppercase tracking-wide font-mono">
                                        <span className="flex items-center gap-2">
                                            <EditableField 
                                                value={event.time || "12:00 AM"}
                                                onSave={(val) => handleUpdateEvent(event.id, 'time', val)}
                                                isEditing={isEditing}
                                                className="min-w-[60px]"
                                            />
                                        </span>
                                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                        <span className="flex items-center gap-2">
                                            <EditableField 
                                                value={event.location || "Google Meet"}
                                                onSave={(val) => handleUpdateEvent(event.id, 'location', val)}
                                                isEditing={isEditing}
                                                className="min-w-[80px]"
                                            />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};
