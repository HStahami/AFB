import os
import sys
import base64
import subprocess
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
LOGO_PATH = ROOT_DIR / "frontend" / "public" / "afb1.jpeg"
PDF_OUT = ROOT_DIR / "Alarabia_LMS_Complete_Documentation.pdf"
HTML_OUT = ROOT_DIR / "LMS_DOCUMENTATION.html"
MD_OUT = ROOT_DIR / "LMS_DOCUMENTATION.md"

# Load logo as base64
logo_b64 = ""
if LOGO_PATH.exists():
    with open(LOGO_PATH, "rb") as f:
        logo_b64 = base64.b64encode(f.read()).decode("utf-8")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Emam LMS - Executive & Non-Technical Platform Guide</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Amiri:wght@400;700&display=swap');

  @page {{
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {{
      content: "Page " counter(page);
      font-size: 8.5pt;
      color: #64748b;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 600;
    }}
    @bottom-left {{
      content: "Emam LMS — Complete Platform Guide (Executive Edition)";
      font-size: 8pt;
      color: #64748b;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
  }}

  @page :first {{
    margin: 0;
    @bottom-right {{ content: none; }}
    @bottom-left {{ content: none; }}
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 9.8pt;
    margin: 0;
    padding: 0;
  }}

  /* Cover Page */
  .cover-page {{
    height: 100vh;
    background: linear-gradient(135deg, #030e0f 0%, #072224 45%, #0a3d42 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48mm 24mm 24mm 24mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }}

  .cover-decor-1 {{
    position: absolute;
    top: -100px;
    right: -100px;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 168, 150, 0.3) 0%, rgba(0,0,0,0) 70%);
    pointer-events: none;
  }}

  .cover-decor-2 {{
    position: absolute;
    bottom: -60px;
    left: -60px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(72, 202, 228, 0.15) 0%, rgba(0,0,0,0) 70%);
    pointer-events: none;
  }}

  .cover-logo-wrapper {{
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 28px;
  }}

  .cover-logo {{
    width: 76px;
    height: 56px;
    border-radius: 10px;
    border: 2px solid rgba(0, 168, 150, 0.7);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    object-fit: cover;
  }}

  .cover-brand {{
    font-size: 22pt;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #c5e5e8;
    line-height: 1.1;
  }}

  .cover-tagline {{
    font-size: 9.5pt;
    color: #02c39a;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-top: 4px;
  }}

  .cover-title-block {{
    margin-top: 36px;
  }}

  .cover-badge {{
    display: inline-block;
    background: rgba(0, 168, 150, 0.25);
    border: 1px solid rgba(0, 168, 150, 0.6);
    color: #a7f3d0;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 5px 14px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }}

  .cover-title {{
    font-size: 32pt;
    font-weight: 800;
    line-height: 1.15;
    color: #ffffff;
    margin: 0 0 14px 0;
    letter-spacing: -1px;
  }}

  .cover-title span {{
    background: linear-gradient(135deg, #02c39a 0%, #48cae4 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .cover-subtitle {{
    font-size: 13pt;
    color: #cbd5e1;
    line-height: 1.5;
    max-width: 640px;
    font-weight: 400;
  }}

  .cover-features-strip {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 30px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(197, 229, 232, 0.18);
    padding: 16px 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }}

  .cover-feature-item {{
    display: flex;
    align-items: center;
    gap: 10px;
  }}

  .cover-feature-icon {{
    font-size: 18pt;
  }}

  .cover-feature-text {{
    display: flex;
    flex-direction: column;
  }}

  .cover-feature-title {{
    font-size: 9.5pt;
    font-weight: 700;
    color: #ffffff;
  }}

  .cover-feature-desc {{
    font-size: 7.8pt;
    color: #94a3b8;
  }}

  .cover-meta {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(197, 229, 232, 0.15);
    padding: 14px 18px;
    border-radius: 10px;
  }}

  .cover-meta-item {{
    display: flex;
    flex-direction: column;
  }}

  .cover-meta-label {{
    font-size: 7.2pt;
    color: #02c39a;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 2px;
  }}

  .cover-meta-val {{
    font-size: 9pt;
    font-weight: 600;
    color: #ffffff;
  }}

  /* Section Styling */
  .page {{
    padding: 4mm 0;
  }}

  .page-break {{
    page-break-before: always;
  }}

  h1, h2, h3, h4 {{
    color: #072224;
    font-weight: 800;
    letter-spacing: -0.3px;
    margin-top: 1.3em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
  }}

  h1 {{
    font-size: 18pt;
    border-bottom: 2px solid #00a896;
    padding-bottom: 6px;
    margin-top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}

  h1 .section-tag {{
    font-size: 8.5pt;
    background: rgba(0, 168, 150, 0.12);
    color: #007a6d;
    padding: 3px 10px;
    border-radius: 999px;
    font-weight: 700;
    border: 1px solid rgba(0, 168, 150, 0.25);
  }}

  h2 {{
    font-size: 13pt;
    color: #0a3d42;
    border-left: 4px solid #00a896;
    padding-left: 8px;
    margin-top: 1.1em;
  }}

  h3 {{
    font-size: 10.8pt;
    color: #1e293b;
    margin-top: 0.9em;
  }}

  p {{
    margin: 0.4em 0 0.7em 0;
    color: #334155;
    text-align: justify;
    font-size: 9.6pt;
  }}

  /* High Impact Callout Boxes */
  .plain-english-box {{
    background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);
    border: 1px solid #99f6e4;
    border-left: 5px solid #0d9488;
    padding: 12px 16px;
    border-radius: 8px;
    margin: 12px 0 16px 0;
    page-break-inside: avoid;
  }}

  .plain-english-title {{
    font-weight: 800;
    font-size: 10pt;
    color: #0f766e;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .plain-english-box p {{
    margin: 0;
    font-size: 9.3pt;
    color: #134e4a;
    line-height: 1.5;
  }}

  /* Before vs After Comparison Grid */
  .comparison-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  .comparison-card {{
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 9pt;
  }}

  .comparison-bad {{
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-top: 4px solid #e11d48;
  }}

  .comparison-bad h4 {{
    color: #be123c;
    margin: 0 0 8px 0;
    font-size: 10.5pt;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .comparison-good {{
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-top: 4px solid #16a34a;
  }}

  .comparison-good h4 {{
    color: #15803d;
    margin: 0 0 8px 0;
    font-size: 10.5pt;
    display: flex;
    align-items: center;
    gap: 6px;
  }}

  .comparison-list {{
    margin: 0;
    padding-left: 18px;
  }}

  .comparison-list li {{
    margin-bottom: 6px;
    line-height: 1.45;
  }}

  /* Role Cards */
  .role-card-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  .role-card {{
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }}

  .role-header {{
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
  }}

  .role-avatar {{
    font-size: 20pt;
    width: 38px;
    height: 38px;
    background: #f8fafc;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
  }}

  .role-title {{
    font-size: 11pt;
    font-weight: 800;
    color: #072224;
    margin: 0;
  }}

  .role-badge {{
    font-size: 7.2pt;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
  }}

  .role-card ul {{
    margin: 6px 0 0 0;
    padding-left: 16px;
    font-size: 8.7pt;
    color: #334155;
  }}

  .role-card li {{
    margin-bottom: 4px;
  }}

  /* Feature Showcase Cards */
  .feature-showcase {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    page-break-inside: avoid;
  }}

  .feature-showcase-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }}

  .feature-showcase-title {{
    font-size: 11pt;
    font-weight: 800;
    color: #072224;
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }}

  .pill {{
    font-size: 7.5pt;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
    text-transform: uppercase;
  }}

  .pill-green {{ background: #dcfce7; color: #166534; }}
  .pill-blue {{ background: #e0f2fe; color: #0369a1; }}
  .pill-purple {{ background: #f3e8ff; color: #6b21a8; }}
  .pill-amber {{ background: #fef3c7; color: #92400e; }}

  .feature-bullets {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-top: 8px;
  }}

  .bullet-item {{
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 8.8pt;
    color: #334155;
  }}

  .bullet-item span.icon {{
    color: #0d9488;
    font-weight: 800;
  }}

  /* Visual Journey Steps */
  .journey-timeline {{
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  .journey-step {{
    display: flex;
    align-items: stretch;
    gap: 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }}

  .journey-badge {{
    width: 32px;
    height: 32px;
    background: #072224;
    color: #2dd4bf;
    font-weight: 800;
    font-size: 10pt;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2px solid #00a896;
    margin-top: 2px;
  }}

  .journey-text {{
    flex: 1;
  }}

  .journey-title {{
    font-weight: 800;
    font-size: 9.8pt;
    color: #072224;
    margin-bottom: 2px;
  }}

  .journey-desc {{
    font-size: 8.7pt;
    color: #475569;
    margin: 0;
    line-height: 1.45;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 8.8pt;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border-radius: 6px;
    overflow: hidden;
  }}

  th, td {{
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }}

  th {{
    background: #072224;
    color: #ffffff;
    font-weight: 700;
    font-size: 8.4pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}

  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  .check-yes {{
    color: #16a34a;
    font-weight: 800;
    font-size: 10.5pt;
  }}

  .check-no {{
    color: #94a3b8;
    font-weight: 600;
  }}

  .summary-stat-grid {{
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 14px 0;
    page-break-inside: avoid;
  }}

  .stat-box {{
    background: #072224;
    color: #ffffff;
    padding: 12px 14px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid rgba(0, 168, 150, 0.4);
  }}

  .stat-val {{
    font-size: 16pt;
    font-weight: 800;
    color: #2dd4bf;
    line-height: 1.1;
  }}

  .stat-label {{
    font-size: 7.6pt;
    color: #cbd5e1;
    text-transform: uppercase;
    font-weight: 700;
    margin-top: 3px;
  }}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-decor-1"></div>
  <div class="cover-decor-2"></div>

  <div>
    <div class="cover-logo-wrapper">
      {'<img class="cover-logo" src="data:image/jpeg;base64,' + logo_b64 + '" alt="AFB Logo"/>' if logo_b64 else ''}
      <div>
        <div class="cover-brand">Emam</div>
        <div class="cover-tagline">Integrated Academic & Virtual Learning Management System</div>
      </div>
    </div>

    <div class="cover-title-block">
      <div class="cover-badge">Executive & Non-Technical Edition</div>
      <div class="cover-title">
        The Complete Guide to<br/>
        <span>Your Virtual Academy</span>
      </div>
      <div class="cover-subtitle">
        Everything you need to know about what the platform does, who uses it, how it simplifies your school's daily operations, and why it is the safest, most durable system for online education.
      </div>
    </div>

    <div class="cover-features-strip">
      <div class="cover-feature-item">
        <div class="cover-feature-icon">🎓</div>
        <div class="cover-feature-text">
          <span class="cover-feature-title">Turnkey School</span>
          <span class="cover-feature-desc">From admission to graduation</span>
        </div>
      </div>
      <div class="cover-feature-item">
        <div class="cover-feature-icon">📹</div>
        <div class="cover-feature-text">
          <span class="cover-feature-title">No Zoom Needed</span>
          <span class="cover-feature-desc">1-click browser classroom</span>
        </div>
      </div>
      <div class="cover-feature-item">
        <div class="cover-feature-icon">🛡️</div>
        <div class="cover-feature-text">
          <span class="cover-feature-title">100% Supervised</span>
          <span class="cover-feature-desc">Full student safety audit</span>
        </div>
      </div>
    </div>
  </div>

  <div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Target Audience</span>
        <span class="cover-meta-val">Stakeholders & Leaders</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Reading Time</span>
        <span class="cover-meta-val">10 Minutes (Plain English)</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Device Support</span>
        <span class="cover-meta-val">Mobile, Tablet & PC</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Platform Status</span>
        <span class="cover-meta-val">Production Ready</span>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 1: WHAT IS THIS SYSTEM? -->
<div class="page">
  <h1>
    <span>1. What is Alarabia LMS in Plain Words?</span>
    <span class="section-tag">Executive Summary</span>
  </h1>

  <div class="plain-english-box">
    <div class="plain-english-title">💡 The 30-Second Summary</div>
    <p>
      Imagine having a <strong>complete, fully staffed digital school campus</strong> running inside any web browser. Students apply online, pay their fees, join live video classes with a single click, practice Arabic handwriting on a digital whiteboard, submit homework, and receive grades — while the principal supervises everything from one central command center.
    </p>
  </div>

  <h2>Why Traditional Methods Fail vs. How AFB Wins</h2>
  <p>
    Most online academies struggle because they use 5 different apps at the same time: WhatsApp for chats, Zoom for classes, Excel for attendance, Google Drive for PDFs, and paper notebooks for homework. This causes lost students, security risks, and administrative burnout.
  </p>

  <div class="comparison-grid">
    <div class="comparison-card comparison-bad">
      <h4>❌ The Old Complicated Way</h4>
      <ul class="comparison-list">
        <li><strong>Scattered Zoom / Google Meet Links:</strong> Links get leaked or lost in WhatsApp chats; students miss classes.</li>
        <li><strong>Standard Whiteboards Fail at Arabic:</strong> Western drawing boards cannot draw Arabic vowels (Zabar, Zer, Pesh) or calligraphy.</li>
        <li><strong>Unmonitored Private Chats:</strong> Teachers and students message on private WhatsApp, creating safety and harassment concerns.</li>
        <li><strong>Lost Homework & Papers:</strong> Homework photos sent on WhatsApp get buried and teachers forget who submitted what.</li>
        <li><strong>Messy Excel Spreadsheets:</strong> Admissions, fee slips, and attendance are tracked on separate files that get corrupted.</li>
      </ul>
    </div>

    <div class="comparison-card comparison-good">
      <h4>✅ The Alarabia (AFB) Way</h4>
      <ul class="comparison-list">
        <li><strong>1-Click Live Classroom:</strong> No Zoom, no meeting IDs, no app downloads. Just click "Join Class" inside the portal.</li>
        <li><strong>Magic Arabic Whiteboard:</strong> Custom digital pen designed specifically for smooth Arabic letters and Tajweed color rules.</li>
        <li><strong>100% Supervised Chat:</strong> Students and teachers message safely on the portal with full administrative monitoring.</li>
        <li><strong>Built-in Homework Portal:</strong> Students upload PDFs or audio recitation files; teachers grade and give feedback on screen.</li>
        <li><strong>Automated Campus Pipeline:</strong> Application $\rightarrow$ Approval $\rightarrow$ Roll Number $\rightarrow$ Fee Notice happens automatically.</li>
      </ul>
    </div>
  </div>

  <div class="summary-stat-grid">
    <div class="stat-box">
      <div class="stat-val">0</div>
      <div class="stat-label">External Apps Needed</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">1-Click</div>
      <div class="stat-label">Live Class Launch</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">100%</div>
      <div class="stat-label">Safety Monitored</div>
    </div>
    <div class="stat-box">
      <div class="stat-val">All Devices</div>
      <div class="stat-label">Phone, Tablet, Laptop</div>
    </div>
  </div>
</div>

<!-- PAGE 2: THE 4 ROLES EXPLAINED -->
<div class="page page-break">
  <h1>
    <span>2. Who Uses the Platform? The 4 Core Roles</span>
    <span class="section-tag">User Access</span>
  </h1>

  <p>
    Everyone who logs into the system gets a customized view tailored exactly to their role. There is zero confusion because users only see the buttons and tools they need.
  </p>

  <div class="role-card-grid">
    <!-- ROLE 1: ADMIN -->
    <div class="role-card">
      <div class="role-header">
        <div class="role-avatar">🛡️</div>
        <div>
          <div class="role-title">1. The Academy Principal (Admin)</div>
          <span class="role-badge" style="background:#fee2e2; color:#991b1b;">Full Control</span>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin: 0 0 6px 0; color: #475569;">
        <strong>Purpose:</strong> Complete oversight, safety, and operational control over the whole school.
      </p>
      <ul>
        <li><strong>Dashboard Overview:</strong> See total active students, fees, attendance rates, and daily classes at a glance.</li>
        <li><strong>Admissions Control:</strong> Review student applications and approve them with one click.</li>
        <li><strong>Teacher Allocation:</strong> Assign teachers to time slots and manage course schedules.</li>
        <li><strong>Chat Safety Audit:</strong> Inspect any message thread between any teacher and student to guarantee decorum and safety.</li>
        <li><strong>Lifecycle Shift:</strong> Graduate students or mark dropouts with clear recorded reasons.</li>
      </ul>
    </div>

    <!-- ROLE 2: INSTRUCTOR -->
    <div class="role-card">
      <div class="role-header">
        <div class="role-avatar">👨‍🏫</div>
        <div>
          <div class="role-title">2. The Teacher (Instructor)</div>
          <span class="role-badge" style="background:#e0f2fe; color:#0369a1;">Teaching Suite</span>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin: 0 0 6px 0; color: #475569;">
        <strong>Purpose:</strong> Teaching live classes, marking attendance, and grading assignments.
      </p>
      <ul>
        <li><strong>Live Teaching Room:</strong> Launch your virtual classroom with one button.</li>
        <li><strong>Arabic Digital Whiteboard:</strong> Draw Quranic letters, highlight Tajweed rules in colors, and display charts.</li>
        <li><strong>Instant Attendance:</strong> Mark students Present, Absent, or Late in 5 seconds.</li>
        <li><strong>Homework & Grading:</strong> Create assignments, listen to student audio recitations, and assign marks.</li>
        <li><strong>Resource Sharing:</strong> Upload lesson slides, books, and audios for students.</li>
      </ul>
    </div>

    <!-- ROLE 3: STUDENT -->
    <div class="role-card">
      <div class="role-header">
        <div class="role-avatar">🎓</div>
        <div>
          <div class="role-title">3. The Student (Learner)</div>
          <span class="role-badge" style="background:#dcfce7; color:#166534;">Learning Portal</span>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin: 0 0 6px 0; color: #475569;">
        <strong>Purpose:</strong> Attending classes, taking notes, submitting homework, and viewing scores.
      </p>
      <ul>
        <li><strong>Upcoming Class Countdown:</strong> See exactly when the next live lecture starts.</li>
        <li><strong>1-Click Video Class:</strong> Join the live class instantly inside their web browser.</li>
        <li><strong>In-Session Smart Notepad:</strong> Type private study notes directly next to the video screen.</li>
        <li><strong>Homework Uploader:</strong> Submit written papers, PDFs, or recorded voice notes.</li>
        <li><strong>Progress & Attendance Report:</strong> See attendance percentage and instructor grades.</li>
      </ul>
    </div>

    <!-- ROLE 4: PUBLIC -->
    <div class="role-card">
      <div class="role-header">
        <div class="role-avatar">🌍</div>
        <div>
          <div class="role-title">4. The Visitor / Parent (Public)</div>
          <span class="role-badge" style="background:#f1f5f9; color:#475569;">Open Access</span>
        </div>
      </div>
      <p style="font-size: 8.5pt; margin: 0 0 6px 0; color: #475569;">
        <strong>Purpose:</strong> Learning about the academy, exploring courses, and applying for admission.
      </p>
      <ul>
        <li><strong>Academy Landing Page:</strong> Read about school mission, teachers, and curriculum.</li>
        <li><strong>Digital Course Catalog:</strong> Explore Arabic & Islamic course modules and schedules.</li>
        <li><strong>Online Admission Form:</strong> Submit application details without visiting an office.</li>
        <li><strong>Contact & Inquiries:</strong> Send direct inquiry messages to the administration.</li>
      </ul>
    </div>
  </div>

  <h2>Role Capabilities Matrix (At A Glance)</h2>
  <table>
    <thead>
      <tr>
        <th>Academy Action</th>
        <th style="text-align: center;">Public Visitor</th>
        <th style="text-align: center;">Student</th>
        <th style="text-align: center;">Teacher</th>
        <th style="text-align: center;">School Principal</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Apply for Admission Online</td>
        <td style="text-align: center;"><span class="check-yes">✔</span></td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-yes">Approve / Reject</span></td>
      </tr>
      <tr>
        <td>Join Live Video Classes</td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Attendee)</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Host / Teacher)</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Full Access)</span></td>
      </tr>
      <tr>
        <td>Draw on Arabic Whiteboard</td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-yes">View & Learn</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Full Control)</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Full Control)</span></td>
      </tr>
      <tr>
        <td>Mark Student Attendance</td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-no">View Own Only</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Assigned Class)</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (All Classes)</span></td>
      </tr>
      <tr>
        <td>Assign & Grade Homework</td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-no">Submit Work</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Create & Grade)</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Audit Grades)</span></td>
      </tr>
      <tr>
        <td>Audit Chat Messages for Safety</td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-no">—</span></td>
        <td style="text-align: center;"><span class="check-yes">✔ (Full Audit)</span></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- PAGE 3: THE SUPER POWERS -->
<div class="page page-break">
  <h1>
    <span>3. The Platform's Super Powers (Key Features)</span>
    <span class="section-tag">Core Features</span>
  </h1>

  <p>
    Here are the built-in features that make Alarabia LMS uniquely capable, reliable, and delightful to use for both students and staff:
  </p>

  <!-- FEATURE 1 -->
  <div class="feature-showcase">
    <div class="feature-showcase-header">
      <h3 class="feature-showcase-title">📹 1. Built-in Live Virtual Classroom (No Zoom / Google Meet Required)</h3>
      <span class="pill pill-green">Zero App Downloads</span>
    </div>
    <p style="margin: 0; font-size: 8.9pt; color: #475569;">
      Students and teachers do not need to install Zoom, Teams, or Google Meet. Everything runs directly inside their web browser with crystal-clear high-definition video, noise suppression, and automatic connection.
    </p>
    <div class="feature-bullets">
      <div class="bullet-item"><span class="icon">✔</span> <strong>1-Click Entry:</strong> Student clicks "Join Live Class" and enters immediately.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Teacher Moderation:</strong> Teacher can mute microphones, toggle cameras, and manage speaking.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Private & Encrypted:</strong> Classrooms are strictly private; strangers cannot join via random links.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Mobile Friendly:</strong> Works smoothly on smartphones, iPads, Android tablets, and PCs.</div>
    </div>
  </div>

  <!-- FEATURE 2 -->
  <div class="feature-showcase">
    <div class="feature-showcase-header">
      <h3 class="feature-showcase-title">✏️ 2. Specialized Arabic & Tajweed Digital Whiteboard</h3>
      <span class="pill pill-blue">Arabic Tailored</span>
    </div>
    <p style="margin: 0; font-size: 8.9pt; color: #475569;">
      Standard digital whiteboards are designed for Western alphabets and struggle with Arabic writing. AFB includes a custom digital whiteboard specifically optimized for Arabic calligraphy and Quranic vowel markers.
    </p>
    <div class="feature-bullets">
      <div class="bullet-item"><span class="icon">✔</span> <strong>Crisp Diacritics (Harakat):</strong> Ultra-smooth strokes render Zabar, Zer, Pesh, and Sukun cleanly without blurring.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Color-Coded Tajweed Rules:</strong> Pre-set color pens allow teachers to highlight rules (e.g. Green for Ikhfa, Red for Madd).</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Shapes & Highlighters:</strong> Draw circles and arrows to point out pronunciation points (Makharij).</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>1-Click Save Image:</strong> Students and teachers can download the finished whiteboard notes as a picture for revision.</div>
    </div>
  </div>

  <!-- FEATURE 3 -->
  <div class="feature-showcase">
    <div class="feature-showcase-header">
      <h3 class="feature-showcase-title">📝 3. In-Class Smart Notebook (Never Lose Lecture Notes)</h3>
      <span class="pill pill-purple">Auto-Saving</span>
    </div>
    <p style="margin: 0; font-size: 8.9pt; color: #475569;">
      During live lectures, students often lose paper notebooks or get distracted switching to Word/Notepad. AFB has a built-in notepad docked right beside the video screen that automatically saves every keystroke.
    </p>
    <div class="feature-bullets">
      <div class="bullet-item"><span class="icon">✔</span> <strong>Side-by-Side Viewing:</strong> Watch the teacher on the left, type lecture notes on the right.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Real-Time Cloud Save:</strong> Even if internet drops, typed notes are never lost.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Revision Library:</strong> All previous notes are organized neatly by date and class for exam study.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Zero Distraction:</strong> Keeps students focused entirely within the school application.</div>
    </div>
  </div>

  <!-- FEATURE 4 -->
  <div class="feature-showcase">
    <div class="feature-showcase-header">
      <h3 class="feature-showcase-title">🕵️‍♂️ 4. Complete Child Safety & Admin Chat Audit System</h3>
      <span class="pill pill-amber">Parent & Institutional Peace of Mind</span>
    </div>
    <p style="margin: 0; font-size: 8.9pt; color: #475569;">
      Unregulated messaging between teachers and students on external apps is a massive liability. AFB eliminates this danger by bringing all communication onto a secure platform with transparent administrative supervision.
    </p>
    <div class="feature-bullets">
      <div class="bullet-item"><span class="icon">✔</span> <strong>100% Transparent Audits:</strong> Principals can review any conversation thread, message text, and sent files anytime.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>No Student-to-Student Chat:</strong> Prevents cyberbullying and inappropriate peer interaction.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>File & Homework Sharing:</strong> Students can send voice recordings and PDFs safely to their teacher.</div>
      <div class="bullet-item"><span class="icon">✔</span> <strong>Institutional Compliance:</strong> Protects the academy, the teachers, and the students from misunderstandings.</div>
    </div>
  </div>
</div>

<!-- PAGE 4: DAILY WORKFLOWS -->
<div class="page page-break">
  <h1>
    <span>4. How It Works in Real Life (Simple Journeys)</span>
    <span class="section-tag">Step-by-Step</span>
  </h1>

  <h2>Journey 1: How a New Student Enrolls (Zero Paperwork)</h2>
  <div class="journey-timeline">
    <div class="journey-step">
      <div class="journey-badge">1</div>
      <div class="journey-text">
        <div class="journey-title">Parent/Student Fills Online Form</div>
        <div class="journey-desc">They visit the academy website, select their desired course (e.g. Quran Tajweed, Arabic Grammar), pick their preferred class timing, and submit.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">2</div>
      <div class="journey-text">
        <div class="journey-title">Principal Reviews & Approves with 1 Click</div>
        <div class="journey-desc">The application appears in the Admin Dashboard under "Pending". The principal verifies the details and clicks "Approve".</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">3</div>
      <div class="journey-text">
        <div class="journey-title">System Automatically Issues Roll Number & Fee Voucher</div>
        <div class="journey-desc">Instantly, the system generates a unique Student Code (e.g. <code>STU-2026-089</code>), sets up their account, and sends an automated fee notice.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">4</div>
      <div class="journey-text">
        <div class="journey-title">Student Logs In & Changes Password</div>
        <div class="journey-desc">For maximum security, on their very first login, the student is prompted to choose their private password.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">5</div>
      <div class="journey-text">
        <div class="journey-title">Ready for Live Classes!</div>
        <div class="journey-desc">The student dashboard lights up with their course schedule, upcoming class countdown, and study materials.</div>
      </div>
    </div>
  </div>

  <h2>Journey 2: A Day in the Life of a Live Class (In 4 Easy Steps)</h2>
  <div class="journey-timeline">
    <div class="journey-step">
      <div class="journey-badge">A</div>
      <div class="journey-text">
        <div class="journey-title">Teacher & Students Click "Join Class"</div>
        <div class="journey-desc">At class time, both click one button on their screens. Video and audio connect instantly in HD.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">B</div>
      <div class="journey-text">
        <div class="journey-title">Teaching on the Arabic Whiteboard</div>
        <div class="journey-desc">The teacher writes Arabic verses on the interactive board, highlighting pronunciation rules in bright colors.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">C</div>
      <div class="journey-text">
        <div class="journey-title">Instant Roll Call Attendance</div>
        <div class="journey-desc">The teacher clicks "Present" or "Absent" for each student. The system instantly updates attendance percentages.</div>
      </div>
    </div>
    <div class="journey-step">
      <div class="journey-badge">D</div>
      <div class="journey-text">
        <div class="journey-title">Homework & Feedback</div>
        <div class="journey-desc">Teacher posts the homework. Students record their Quran recitation audio or upload their worksheet, and the teacher grades it before the next class.</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 5: WHY IS IT STRONG, FAST & RELIABLE? -->
<div class="page page-break">
  <h1>
    <span>5. Durability, Speed & Peace of Mind</span>
    <span class="section-tag">Durability & Trust</span>
  </h1>

  <p>
    When choosing software for an educational institution, you need to know: <em>Will it crash when 100 students join? Is our data safe from hackers? What happens if someone tries to spam the admission form?</em>
  </p>

  <div class="plain-english-box">
    <div class="plain-english-title">🛡️ Built Like a Modern Bank, Not a Fragile School Project</div>
    <p>
      Alarabia LMS uses the same high-speed technology stack trusted by global tech giants (FastAPI, React, MongoDB). It is engineered to withstand heavy class hours, cyber attacks, and bad internet connections without blinking.
    </p>
  </div>

  <h2>4 Non-Technical Guarantees of Reliability</h2>
  <div class="role-card-grid">
    <div class="role-card">
      <h3 style="margin-top:0; color:#0d9488;">⚡ 1. High Speed & Never Slows Down</h3>
      <p style="font-size: 8.8pt;">
        Unlike heavy old systems (like Moodle) that take 5 seconds to load each page, AFB uses ultra-modern lightweight technology. Pages switch instantly in milliseconds, even on ordinary home Wi-Fi or mobile 4G.
      </p>
    </div>
    <div class="role-card">
      <h3 style="margin-top:0; color:#0284c7;">🔒 2. Automatic Hacker & Bot Shield</h3>
      <p style="font-size: 8.8pt;">
        The system has a built-in anti-abuse shield. If a hacker or bot tries to guess passwords or flood the admission form with spam, the system automatically blocks their internet connection before they can do any harm.
      </p>
    </div>
    <div class="role-card">
      <h3 style="margin-top:0; color:#7c3aed;">💾 3. Zero Lost Records (Cloud Safeguarded)</h3>
      <p style="font-size: 8.8pt;">
        Every student profile, fee receipt, attendance checkmark, and exam grade is permanently preserved in high-durability cloud databases with automatic multi-point backups. No more lost spreadsheets!
      </p>
    </div>
    <div class="role-card">
      <h3 style="margin-top:0; color:#ea580c;">📱 4. Works Everywhere on Every Device</h3>
      <p style="font-size: 8.8pt;">
        Whether a parent is checking fees on an iPhone, a teacher is drawing on an Android tablet with a stylus, or a principal is reviewing audits on a Windows laptop — the design adjusts seamlessly to every screen.
      </p>
    </div>
  </div>

  <h2>Direct Comparison: Managing Manually vs. Using Alarabia LMS</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Area</th>
        <th style="width: 35%;">Without Alarabia LMS</th>
        <th style="width: 40%;">With Alarabia LMS (AFB)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Live Video Classes</strong></td>
        <td>Messy Zoom links sent in WhatsApp groups; parents lose links; strangers can join.</td>
        <td><strong>1-Click Secure Room:</strong> Built right into the portal. Zero external links, zero distractions.</td>
      </tr>
      <tr>
        <td><strong>Arabic & Quran Teaching</strong></td>
        <td>Difficult to write on screen; Arabic vowels blur; no way to mark Tajweed colors.</td>
        <td><strong>Magic Arabic Board:</strong> Designed specifically for Arabic calligraphy and Tajweed rules.</td>
      </tr>
      <tr>
        <td><strong>Attendance Tracking</strong></td>
        <td>Teacher writes in paper register or forgets; parents have no idea if student attended.</td>
        <td><strong>Automatic Scorecard:</strong> Real-time attendance percentage visible to student and admin.</td>
      </tr>
      <tr>
        <td><strong>Homework & Recitation</strong></td>
        <td>Audio messages buried in WhatsApp chats; lost homework; delayed feedback.</td>
        <td><strong>Organized Homework Portal:</strong> Upload PDF/audio; teacher grades with comments in one place.</td>
      </tr>
      <tr>
        <td><strong>Student Safety & Discipline</strong></td>
        <td>Principal has no idea what is being discussed in private teacher-student chats.</td>
        <td><strong>Admin Chat Audit:</strong> 100% transparent review panel for institutional safety and compliance.</td>
      </tr>
      <tr>
        <td><strong>Admissions & Enrollments</strong></td>
        <td>Paper forms, manual data entry, lost applicant phone numbers, manual roll numbers.</td>
        <td><strong>Automated Campus Pipeline:</strong> Auto-generates student IDs, login credentials, and fee notices.</td>
      </tr>
    </tbody>
  </table>

  <div class="callout" style="margin-top: 18px; background: #f0fdfa; border: 1px solid #99f6e4; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 8px;">
    <div style="font-weight: 800; color: #0f766e; font-size: 9.8pt; margin-bottom: 4px;">🎯 Bottom-Line Verdict for Academy Stakeholders</div>
    <p style="margin: 0; font-size: 9pt; color: #134e4a;">
      Emam LMS takes away the daily headache of running an online institute. It provides school owners and academic directors with complete control, guarantees student safety, empowers teachers with specialized Arabic tools, and gives students an engaging, stress-free virtual learning experience.
    </p>
  </div>
</div>

</body>
</html>
"""

# Write HTML
with open(HTML_OUT, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"HTML generated at: {HTML_OUT}")

# Render PDF using Chrome Headless
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(chrome_path):
    chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"

if os.path.exists(chrome_path):
    print("Converting HTML to PDF via Google Chrome Headless...")
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_OUT}",
        str(HTML_OUT)
    ]
    subprocess.run(cmd, check=True)
    if PDF_OUT.exists():
        print(f"Non-technical PDF generated successfully at: {PDF_OUT} ({PDF_OUT.stat().st_size} bytes)")
    else:
        print("PDF output file was not created.")
else:
    print("Chrome executable not found.")

# Write Markdown version as well
md_content = """# Emam (AFB) LMS
## The Complete Digital Academy & E-Learning Platform
### Executive & Non-Technical Guide

> **Prepared For:** Academic Directors, School Principals, Investors, Parents & Non-Technical Stakeholders  
> **Purpose:** Plain-English walkthrough of platform features, roles, workflows, safety, and capabilities.  
> **Status:** Production Ready & Turnkey Deployed  

---

## 1. What is Alarabia LMS in Plain Words?
Think of **Alarabia LMS as an all-in-one digital school campus** running directly inside any web browser. 

Students apply online, pay their fees, join live video classes with a single click, practice Arabic handwriting on a digital whiteboard, submit homework, and receive grades — while the principal supervises everything from one central command center.

### The Old Complicated Way vs. The Alarabia (AFB) Way
| The Old Complicated Way (Without AFB) | The Alarabia (AFB) Way |
| :--- | :--- |
| **Messy Zoom / Google Meet Links:** Links get leaked or lost in WhatsApp chats; students miss classes. | **1-Click Live Classroom:** No Zoom, no meeting IDs, no app downloads. Just click "Join Class" inside the portal. |
| **Standard Whiteboards Fail at Arabic:** Western drawing boards cannot draw Arabic vowels (Zabar, Zer, Pesh) or calligraphy. | **Magic Arabic Whiteboard:** Custom digital pen designed specifically for smooth Arabic letters and Tajweed color rules. |
| **Unmonitored Private Chats:** Teachers and students message on private WhatsApp, creating safety concerns. | **100% Supervised Chat:** Students and teachers message safely on the portal with full administrative monitoring. |
| **Lost Homework & Papers:** Homework photos sent on WhatsApp get buried and teachers forget who submitted what. | **Built-in Homework Portal:** Students upload PDFs or audio recitation files; teachers grade and give feedback on screen. |
| **Messy Excel Spreadsheets:** Admissions, fee slips, and attendance are tracked on separate files that get corrupted. | **Automated Campus Pipeline:** Application → Approval → Roll Number → Fee Notice happens automatically. |

---

## 2. The 4 Roles Explained (Who Uses What?)

### 1. The Academy Principal (Super Admin) - Full Institutional Control
* **Dashboard Overview:** See total active students, attendance rates, incoming admissions, and daily classes at a glance.
* **Admissions Control:** Review student applications and approve them with one click.
* **Teacher Allocation:** Assign teachers to time slots and manage course schedules.
* **Chat Safety Audit:** Inspect any message thread between any teacher and student to guarantee decorum and safety.
* **Lifecycle Shift:** Graduate students or mark dropouts with clear recorded reasons.

### 2. The Teacher (Instructor) - Virtual Teaching Suite
* **Live Teaching Room:** Launch your virtual classroom with one button.
* **Arabic Digital Whiteboard:** Draw Quranic letters, highlight Tajweed rules in colors, and display charts.
* **Instant Attendance:** Mark students Present, Absent, or Late in 5 seconds.
* **Homework & Grading:** Create assignments, listen to student audio recitations, and assign marks.
* **Resource Sharing:** Upload lesson slides, books, and audios for students.

### 3. The Student (Learner) - Interactive Learning Portal
* **Upcoming Class Countdown:** See exactly when the next live lecture starts.
* **1-Click Video Class:** Join the live class instantly inside their web browser.
* **In-Session Smart Notepad:** Type private study notes directly next to the video screen.
* **Homework Uploader:** Submit written papers, PDFs, or recorded voice notes.
* **Progress & Attendance Report:** See attendance percentage and instructor grades.

### 4. The Visitor / Parent (Public) - Open Access
* **Academy Landing Page:** Read about school mission, teachers, and curriculum.
* **Digital Course Catalog:** Explore Arabic & Islamic course modules and schedules.
* **Online Admission Form:** Submit application details without visiting an office.
* **Contact & Inquiries:** Send direct inquiry messages to the administration.

---

## 3. The Platform's Super Powers (Key Features)

### 📹 1. Built-in Live Virtual Classroom (No Zoom Needed)
* **Zero App Downloads:** Runs directly inside any web browser with HD video and clear sound.
* **1-Click Entry:** Students click "Join Live Class" and enter immediately.
* **Teacher Moderation:** Mute microphones, manage speaking, and share screens.
* **Private & Encrypted:** Completely private; strangers cannot join via random links.

### ✏️ 2. Specialized Arabic & Tajweed Digital Whiteboard
* **Crisp Diacritics (Harakat):** Ultra-smooth strokes render Zabar, Zer, Pesh, and Sukun cleanly without blurring.
* **Color-Coded Tajweed Rules:** Pre-set color pens allow teachers to highlight rules (e.g. Green for Ikhfa, Red for Madd).
* **Shapes & Highlighters:** Draw circles and arrows to point out pronunciation points (Makharij).
* **1-Click Save Image:** Save whiteboard notes as an image for revision.

### 📝 3. In-Class Smart Notebook
* **Side-by-Side Viewing:** Watch the teacher on the left, type lecture notes on the right.
* **Real-Time Cloud Save:** Even if internet drops, typed notes are never lost.
* **Revision Library:** All previous notes are organized neatly by date and class for exam study.

### 🕵️‍♂️ 4. Complete Child Safety & Admin Chat Audit System
* **100% Transparent Audits:** Principals can review any conversation thread, message text, and sent files anytime.
* **No Student-to-Student Chat:** Prevents cyberbullying and inappropriate peer interaction.
* **File & Homework Sharing:** Students can send voice recordings and PDFs safely to their teacher.

---

## 4. How It Works in Real Life (Simple Step-by-Step Journeys)

### Journey 1: How a New Student Enrolls (Zero Paperwork)
1. **Parent/Student Fills Online Form:** Submits desired course, preferred class timing, and contact details.
2. **Principal Reviews & Approves with 1 Click:** Verifies details in Admin Panel and clicks "Approve".
3. **System Automatically Issues Roll Number & Fee Voucher:** Generates unique Student Code (e.g. `STU-2026-089`) and sends fee notification.
4. **Student Logs In & Changes Password:** Mandatory security check on first login.
5. **Ready for Live Classes!** Dashboard shows upcoming class countdown.

### Journey 2: A Day in the Life of a Live Class
1. **Join Class:** Teacher and students click "Join Class" at scheduled time.
2. **Arabic Whiteboard Teaching:** Teacher explains verses and grammar on the digital board.
3. **Instant Roll Call:** Teacher marks attendance in 5 seconds.
4. **Homework & Feedback:** Teacher publishes assignment; student uploads homework/audio recitation; teacher assigns marks.

---

## 5. Durability, Speed & Peace of Mind
* **⚡ High Speed & Never Slows Down:** Loads in milliseconds even on ordinary home Wi-Fi or mobile 4G.
* **🔒 Automatic Hacker & Bot Shield:** Anti-abuse firewall automatically blocks password guessing bots and spam form submissions.
* **💾 Zero Lost Records:** All student profiles, fee receipts, and attendance records are permanently backed up in cloud storage.
* **📱 Works on Every Device:** Seamlessly adapts to smartphones, iPads, Android tablets, laptops, and desktop computers.
"""

with open(MD_OUT, "w", encoding="utf-8") as f:
    f.write(md_content)
print(f"Markdown generated at: {MD_OUT}")
