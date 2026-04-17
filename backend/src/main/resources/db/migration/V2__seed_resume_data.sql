-- V2: Seed resume sections from Juhyeon Lee's CV
-- Note: Resume positioning will shift to Agentic Engineering later

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('summary', 'Professional Summary',
'Java backend developer with approximately two years of professional experience building and maintaining enterprise systems in Korea''s financial sector using Java and Spring Boot. Currently attending Hive Helsinki to deepen computer science fundamentals in C and C++, including hands-on work in concurrency, memory management, and systems design. Comfortable working across the stack, and consistent in one thing across every role: when something is unclear, I find the answer myself and see the work through to completion.',
1);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('skills', 'Technical Skills',
'Languages: Java, C, C++, JavaScript, Shell Script
Frameworks: Spring Boot, REST API, Microservices
Database: Oracle, PostgreSQL, SQL
Tools: Git, SSH, GDB, Valgrind, Docker
UNIX/POSIX: File I/O, IPC, Process Management, Concurrency
Web: HTML5/CSS3, React',
2);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('experience', 'DB Insurance (Dongbu Insurance) Co. Ltd',
'Web Operations Engineer (Freelance) | Apr 2023 – May 2023

- Joined as a short-term contractor to cover an immediate team vacancy, quickly adapting to existing workflows and team processes
- Carried out content updates, bug fixes, and functional testing while following established deployment and release procedures',
3);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('experience', 'Korean National Police Agency',
'Full-Stack Engineer (Contract) | Aug 2022 – Mar 2023

- Served as a full-stack developer in a small team, taking ownership of entire features from UI design implementation to backend logic
- Proactively identified and reported a database schema issue to the project lead, then directly resolved it after receiving approval
- Gained extensive hands-on experience across the full stack under high-pressure conditions, handling a large volume of work with limited team resources',
4);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('experience', 'Hyundai Commercial Co. Ltd',
'Integration Engineer (Contract) | Feb 2022 – Jul 2022

- Took on expanded responsibilities beyond the original scope, implementing web functionality in addition to ESB (Enterprise Service Bus) integration work
- Owned assigned tasks end-to-end, identifying blockers independently and seeing every piece of work through to completion
- Learned how to communicate and coordinate across teams during deployment cycles, understanding how cross-team collaboration works in a real production environment',
5);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('experience', 'Hyundai Capital Co. Ltd',
'Integration Developer (Contract) | Feb 2021 – Jan 2022

- Onboarded onto proprietary internal tools with no formal documentation by directly reaching out to experienced colleagues across teams, reaching full productivity within weeks
- Diagnosed and resolved critical production issues during deployment cycles, maintaining business continuity
- Built trust through a self-driven approach, leading to an invitation to continue on the next project with the same team lead',
6);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('education', 'Education',
'Hive Helsinki (42 Network) | Expected Graduation: July 2026 | Nov 2024 – Present
Intensive program in low-level systems programming, algorithms, data structures, and software engineering principles

Gangdong University | Associate Degree in Leisure Sports | Mar 2015 – Feb 2017',
7);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('languages', 'Languages',
'Korean: Native
English: Professional Working Proficiency',
8);

INSERT INTO resume_sections (section_type, title, content, display_order) VALUES
('contact', 'Contact',
'Location: Vantaa, Finland
Email: xx.juon@gmail.com
GitHub: github.com/juhyeonl-hub
LinkedIn: linkedin.com/in/juhyeon-lee-54aa1a223',
9);
