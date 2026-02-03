import { useState, useEffect } from "react";

// Default Data
const DEFAULT_DATA = {
  gallery: [
    {
      id: 1,
      title: "Urban Flow",
      type: "Projects",
      author: "Ko Geon",
      date: "2025.08.27",
      endDate: "2025.12.20",
      site: "Seoul, Jongno-gu",
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "A study of urban density and flow dynamics in Seoul.",
      detailContent: "This project explores the intricate relationship between high-density urban environments and human flow. \n\nThe concept revolves around 'porosity' in architecture—creating spaces that breathe and allow movement through them rather than around them. \n\nStarting with site analysis in Jongno-gu, we identified key pedestrian bottlenecks and proposed a new vertical pathway system that integrates with existing transit nodes.",
      pdfUrl: "#",
    },
    {
      id: 2,
      title: "Minimalist Void",
      type: "Projects",
      author: "Park Kyeong-jun",
      date: "2025.08.28",
      endDate: "2025.11.15",
      site: "Busan, Haeundae",
      image:
        "https://images.unsplash.com/photo-1505577058444-a3dab90d4253?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "Residential space focusing on negative space and light.",
      detailContent: "Minimalist Void challenges the conventional notion of luxury in residential design. Instead of ornamentation, we focused on the luxury of space and light. \n\nThe layout is organized around a central atrium that brings natural light deep into the core of the building. Materials are kept raw and honest—exposed concrete, natural wood, and glass.",
      pdfUrl: "#",
    },
    {
      id: 3,
      title: "Neon Future",
      type: "Projects",
      author: "Yoo Seung-min",
      date: "2025.08.29",
      endDate: "2025.12.30",
      site: "Tokyo, Shibuya",
      image:
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "Cyberpunk aesthetic exploration for a commercial complex.",
      detailContent: "Set in the heart of Shibuya, Neon Future is a speculative design project imagining a commercial complex in 2050. \n\nThe design integrates holographic advertising as a structural element, blurring the line between physical architecture and digital information overlay.",
      pdfUrl: "#",
    },
    {
      id: 4,
      title: "Exhibition Hall A",
      type: "Projects",
      author: "Ryu Hyun-jung",
      date: "2025.09.01",
      endDate: "2026.01.10",
      site: "Seoul, DDP",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "Public exhibition space design for the modern era.",
      detailContent: "Designed for the Dongdaemun Design Plaza (DDP), this exhibition hall features a modular wall system that can be reconfigured for various types of art installations. \n\nThe lighting system is fully automated and adaptive, ensuring optimal viewing conditions for both 2D and 3D works.",
      pdfUrl: "#",
    },
    {
      id: 5,
      title: "Concrete Jungle",
      type: "Projects",
      author: "Yang Hyung-seok",
      date: "2025.09.10",
      endDate: "2025.11.30",
      site: "Incheon, Songdo",
      image:
        "https://images.unsplash.com/photo-1487958449943-2429e8be8625?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "Brutalist architecture in a natural setting.",
      detailContent: "Concrete Jungle creates a dialogue between the heavy, permanent nature of brutalist concrete structures and the ephemeral, changing nature of the surrounding vegetation. \n\nOver time, the building is designed to be overtaken by nature, with planter boxes integrated into the structural facade.",
      pdfUrl: "#",
    },
    {
      id: 6,
      title: "Glass Pavilion",
      type: "Projects",
      author: "Kwon Si-hyun",
      date: "2025.09.15",
      endDate: "2026.02.01",
      site: "Jeju Island",
      image:
        "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description:
        "Transparent structures merging with the environment.",
      detailContent: "Located on the coast of Jeju Island, the Glass Pavilion is an exercise in dematerialization. \n\nUsing structural glass fins and a low-iron glass envelope, the boundary between interior and exterior is dissolved, offering panoramic views of the ocean.",
      pdfUrl: "#",
    },
    {
      id: 7,
      title: "Digital Canvas",
      type: "Activities",
      author: "Kim Ji-eun",
      date: "2025.10.01",
      endDate: "2025.10.05",
      site: "Seoul, Hongdae",
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description: "Interactive media installation workshop.",
      detailContent: "A 5-day workshop held in Hongdae, teaching students how to use TouchDesigner and Kinect sensors to create interactive projection mapping installations. \n\nThe final output was a public exhibition where passersby could influence the visual patterns on the gallery wall through their movement.",
      pdfUrl: "#",
    },
    {
      id: 8,
      title: "Sustainable Block",
      type: "Projects",
      author: "Shim Jung-eun",
      date: "2025.10.05",
      endDate: "2026.03.01",
      site: "Seoul, Eunpyeong",
      image:
        "https://images.unsplash.com/photo-1518005052357-e98719a066d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      description: "Eco-friendly modular housing system.",
      detailContent: "Sustainable Block proposes a new model for urban housing using mass timber construction. \n\nThe modular units are pre-fabricated off-site to reduce construction waste and noise pollution. The design incorporates passive solar principles and rainwater harvesting.",
      pdfUrl: "#",
    },
  ],
  schedule: [
    {
      id: 1,
      date: "2026-02-05",
      title: "Project Kickoff",
      description: "Initial meeting for the Q1 roadmap.",
    },
    {
      id: 2,
      date: "2026-02-10",
      title: "Design Sprint: Week 1",
      description: "Focusing on UX/UI patterns.",
    },
    {
      id: 3,
      date: "2026-02-12",
      title: "Client Review",
      description: "Feedback session with the stakeholders.",
    },
    {
      id: 4,
      date: "2026-02-18",
      title: "Tech Talk: WebGL",
      description:
        "Internal sharing session about 3D on the web.",
    },
    {
      id: 5,
      date: "2026-02-22",
      title: "Site Visit: Seongsu",
      description: "Field trip for the renovation project.",
    },
    {
      id: 6,
      date: "2026-02-28",
      title: "Monthly Wrap-up",
      description:
        "Reviewing progress and setting goals for March.",
    },
    {
      id: 7,
      date: "2026-03-05",
      title: "Concept Presentation",
      description:
        "Presenting the new brand identity concepts.",
    },
    {
      id: 8,
      date: "2026-03-10",
      title: "Workshop: Materiality",
      description:
        "Hands-on workshop with sustainable materials.",
    },
    {
      id: 9,
      date: "2026-03-15",
      title: "Project Alpha Review",
      description:
        "Internal critique session for the new commercial complex.",
    },
    {
      id: 10,
      date: "2026-03-20",
      title: "Site Visit: Gangnam",
      description:
        "Field verification for the remodeling project.",
    },
    {
      id: 11,
      date: "2026-03-25",
      title: "Guest Lecture",
      description:
        "Invited speaker from Zaha Hadid Architects.",
    },
    {
      id: 12,
      date: "2026-04-01",
      title: "Generative Art Exhibition",
      description: "Team showcase at DDP.",
    },
    {
      id: 13,
      date: "2026-04-05",
      title: "Open Studio Day",
      description: "Inviting public to the studio.",
    },
    {
      id: 14,
      date: "2026-04-12",
      title: "Hackathon",
      description: "24-hour design and code challenge.",
    },
    {
      id: 15,
      date: "2026-04-20",
      title: "Final Delivery",
      description: "Submission of the competition entry.",
    },
  ],
  study: [
    {
      id: 1,
      week: "WEEK 14",
      date: "2025-11-21",
      title: "Final Critique",
      content:
        "Final presentation and feedback session. Wrapping up the semester.",
      tags: ["Critique", "Final"],
    },
    {
      id: 2,
      week: "WEEK 13",
      date: "2025-11-18",
      title: "Team Dinner",
      content: "Social gathering and networking.",
      tags: ["Event", "Social"],
    },
    {
      id: 3,
      week: "WEEK 12",
      date: "2025-11-14",
      title: "Panel Critique 1",
      content:
        "First round of panel critiques. Feedback on layout and visual hierarchy.",
      tags: ["Critique", "Layout"],
    },
    {
      id: 4,
      week: "WEEK 11",
      date: "2025-11-11",
      title: "D5 Workshop",
      content:
        "Applying D5 skills to individual projects. Q&A session.",
      tags: ["Workshop", "Skills"],
    },
    {
      id: 5,
      week: "WEEK 10",
      date: "2025-11-07",
      title: "D5 Animation",
      content:
        "Learning animation techniques in D5 Render for architectural walkthroughs.",
      tags: ["Tech", "Animation"],
    },
    {
      id: 6,
      week: "WEEK 9",
      date: "2025-11-04",
      title: "D5 Materials",
      content:
        "Deep dive into PBR materials and texturing workflow.",
      tags: ["Tech", "Materials"],
    },
    {
      id: 7,
      week: "WEEK 8",
      date: "2025-10-31",
      title: "D5 Lighting",
      content:
        "Study on HDRI lighting, artificial lights, and atmosphere settings.",
      tags: ["Tech", "Lighting"],
    },
    {
      id: 8,
      week: "WEEK 7",
      date: "2025-10-28",
      title: "D5 Render Intro",
      content:
        "Getting started with D5 Render. Interface and basic assets.",
      tags: ["Tech", "Intro"],
    },
    {
      id: 9,
      week: "WEEK 6",
      date: "2025-10-20",
      title: "Midterm Prep",
      content:
        "Individual preparation for university midterm exams.",
      tags: ["Exam", "Prep"],
    },
    {
      id: 10,
      week: "WEEK 5",
      date: "2025-09-30",
      title: "Rest Week",
      content: "Break week. No official study session.",
      tags: ["Break"],
    },
    {
      id: 11,
      week: "WEEK 4",
      date: "2025-09-26",
      title: "Portfolio Workshop",
      content:
        "Peer review of individual portfolios and layout refinements.",
      tags: ["Review", "Design"],
    },
    {
      id: 12,
      week: "WEEK 3",
      date: "2025-09-23",
      title: "InDesign Advanced",
      content:
        "Advanced layout techniques and data merge for efficiency.",
      tags: ["Tool", "InDesign"],
    },
    {
      id: 13,
      week: "WEEK 2",
      date: "2025-09-16",
      title: "InDesign Basics",
      content:
        "Introduction to Adobe InDesign interface and basic tools.",
      tags: ["Tool", "InDesign"],
    },
    {
      id: 14,
      week: "WEEK 1",
      date: "2025-09-09",
      title: "Orientation",
      content: "Course overview and team formation.",
      tags: ["Intro", "Team"],
    },
  ],
  team: [
    {
      id: 1,
      name: "Ko Geon",
      role: "Spatial Designer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Leading the structural design team.",
    },
    {
      id: 2,
      name: "Park Kyeong-jun",
      role: "Space Designer",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Focus on minimalist interiors.",
    },
    {
      id: 3,
      name: "Yoo Seung-min",
      role: "3D Artist",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Visualizing future concepts.",
    },
    {
      id: 4,
      name: "Ryu Hyun-jung",
      role: "Curator",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Managing exhibitions and public relations.",
    },
    {
      id: 5,
      name: "Yang Hyung-seok",
      role: "Engineer",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Structural engineering specialist.",
    },
    {
      id: 6,
      name: "Kwon Si-hyun",
      role: "Space Designer",
      image:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Experimental forms and materials.",
    },
    {
      id: 7,
      name: "Kim Ji-eun",
      role: "Media Artist",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Interactive installations.",
    },
    {
      id: 8,
      name: "Shim Jung-eun",
      role: "Researcher",
      image:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      bio: "Sustainable materials research.",
    },
    {
      id: 9,
      name: "Kim Do-kyeong",
      role: "Space Designer",
      image:
        "https://images.unsplash.com/photo-1729559149720-2b6c5c200428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGFzaWFuJTIwbWFuJTIwcHJvZmVzc2lvbmFsJTIwYXJjaGl0ZWN0JTIwYmxhY2slMjBhbmQlMjB3aGl0ZXxlbnwxfHx8fDE3NzAwOTU2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      bio: "Focus on urban regeneration and public spaces.",
    },
  ],
  archive: [
    // Awards
    {
      id: 1,
      year: "2025",
      title: "Best Concept Design",
      type: "Award",
      issuer: "International Spatial Design Awards",
    },
    {
      id: 2,
      year: "2024",
      title: "Excellence Award",
      type: "Award",
      issuer: "Korea Spatial Design Contest",
    },
    {
      id: 3,
      year: "2024",
      title: "Red Dot Design Award",
      type: "Award",
      issuer: "Red Dot",
    },
    {
      id: 4,
      year: "2024",
      title: "iF Design Student Award",
      type: "Award",
      issuer: "iF Design",
    },
    {
      id: 5,
      year: "2023",
      title: "Best Interior",
      type: "Award",
      issuer: "KOSID",
    },

    // Publications
    {
      id: 6,
      year: "2024",
      title: "Future Living Spaces",
      type: "Publication",
      author: "Ko Geon",
    },
    {
      id: 7,
      year: "2024",
      title: "Parametric Urbanism",
      type: "Publication",
      author: "Kim Ji-eun",
    },
    {
      id: 8,
      year: "2024",
      title: "Sustainable Materials in 21st Century",
      type: "Publication",
      author: "Park Kyeong-jun",
    },
    {
      id: 9,
      year: "2023",
      title: "The Void in Spatial Design",
      type: "Publication",
      author: "Ryu Hyun-jung",
    },
    {
      id: 10,
      year: "2023",
      title: "Digital Twin Applications",
      type: "Publication",
      author: "Yoo Seung-min",
    },
  ],
  recruitment: {
    status: "Open Positions Available",
    title1: "WE ARE LOOKING FOR",
    title2: "VISIONARIES",
    roles: "Spatial Designer • Researcher • Creative Coder",
    cta: "Apply Below",
  },
  config: {
    liveStudioLink: "https://us05web.zoom.us/j/84476669099?pwd=uEzH7ENyOs7p5bjNPToNNvENjTKRgb.1",
    googleMeetLink: "https://meet.google.com/vku-vhvy-bpy",
    slackLink: "https://app.slack.com/client/T0AACLVK431/D0AAXPC4YBE",
    instagramLink: "https://www.instagram.com/toolboxrender/",
    notionLink: "https://www.notion.so/TOOLBOX-2e1c72439e1c80699c61e504121cdea1?source=copy_link",
    contactEmail: "8268go@Naver.com",
    contactPhone: "+82 10-4948-8268"
  },
  inbox: [
      {
          id: 1,
          date: '2026-02-01',
          name: 'Example Candidate',
          email: 'candidate@example.com',
          phone: '010-1234-5678',
          portfolio: 'https://portfolio.com',
          message: 'Hello, I am interested in joining your team as a junior designer. I have experience with Rhino and Unreal Engine.',
          status: 'unread'
      }
  ],
  hero: {
    title: "TOOLBOX",
    subtitle: "PORTFOLIO",
    description: "WE BUILD SPACES, BOTH PHYSICAL AND DIGITAL.",
    scrollText: "SCROLL TO EXPLORE",
  },
  marquee: {
    text: "SPATIAL DESIGN • INTERIOR • INTERACTIVE MEDIA • GENERATIVE ART •",
    speed: 20,
  },
  footer: {
    title1: "Designing",
    title2: "The Future",
    title3: "Of Space.",
    joinButton: "Join Us",
    socials: [
      {
        id: "insta",
        label: "Instagram",
        url: "#",
        icon: "Instagram",
      },
      { id: "notion", label: "Notion", url: "#", icon: "Box" },
    ],
    copyright: "© 2025 TOOLBOX. ALL RIGHTS RESERVED.",
  },
};

// Hook for data management
export const useData = () => {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("TOOLBOX_DATA");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic migration check
        if (parsed.study && parsed.study.length < 5) {
          setData(DEFAULT_DATA);
        } else {
          // Ensure config exists
          if (!parsed.config) {
             parsed.config = DEFAULT_DATA.config;
          } else {
            // Merge defaults for new keys
            const newConfig = { ...DEFAULT_DATA.config, ...parsed.config };
            
            // FORCE REPAIR: If specific keys are default/empty/hash in the saved data, overwrite them with the new DEFAULT_DATA values.
            // This fixes the issue where old empty data persists.
            const keysToRepair = ['liveStudioLink', 'googleMeetLink', 'slackLink', 'instagramLink', 'notionLink'];
            keysToRepair.forEach(key => {
                const savedVal = parsed.config[key];
                // Check if it's empty, #, or the old default
                if (!savedVal || savedVal === '#' || savedVal === 'https://meet.google.com' || savedVal === 'https://slack.com' || savedVal === 'https://instagram.com' || savedVal === 'https://notion.so') {
                    // Force update with new default
                    newConfig[key] = (DEFAULT_DATA.config as any)[key];
                }
            });

            parsed.config = newConfig;
          }

          // Ensure inbox exists
          if (!parsed.inbox) {
              parsed.inbox = DEFAULT_DATA.inbox;
          }

          // Ensure new member is in data if it was cached before
          if (
            parsed.team &&
            !parsed.team.find(
              (m: any) => m.name === "Kim Do-kyeong",
            )
          ) {
            parsed.team = DEFAULT_DATA.team;
          }
          // Ensure new archive data structure is present if data is old
          if (parsed.archive && parsed.archive.length < 5) {
            parsed.archive = DEFAULT_DATA.archive;
          }
          // Ensure recruitment data exists
          if (!parsed.recruitment) {
            parsed.recruitment = DEFAULT_DATA.recruitment;
          }
          // Ensure hero, marquee, footer data exists
          if (!parsed.hero) parsed.hero = DEFAULT_DATA.hero;
          if (!parsed.marquee)
            parsed.marquee = DEFAULT_DATA.marquee;
          if (!parsed.footer)
            parsed.footer = DEFAULT_DATA.footer;

          // Ensure gallery items have new fields
          if (parsed.gallery) {
            parsed.gallery = parsed.gallery.map((item: any) => ({
              ...item,
              endDate: item.endDate || "2025.12.31",
              site: item.site || "Seoul, South Korea",
              pdfUrl: item.pdfUrl || "#",
              detailContent: item.detailContent || "Project Detail Description..."
            }));
          }

          setData(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved data", e);
        setData(DEFAULT_DATA);
      }
    }
    setLoaded(true);
  }, []);

  const updateData = (
    section: keyof typeof DEFAULT_DATA,
    newData: any,
  ) => {
    const updated = { ...data, [section]: newData };
    setData(updated);
    localStorage.setItem(
      "TOOLBOX_DATA",
      JSON.stringify(updated),
    );
  };

  const updateConfig = (key: string, value: string) => {
    const updated = {
      ...data,
      config: { ...data.config, [key]: value },
    };
    setData(updated);
    localStorage.setItem(
      "TOOLBOX_DATA",
      JSON.stringify(updated),
    );
  };

  return { data, updateData, updateConfig, loaded };
};
