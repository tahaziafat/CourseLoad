(() => {
  "use strict";
  // Keep the original keys so existing tasks and the daily limit remain available.
  const TASKS_KEY = "courseload.tasks.v1";
  const LIMIT_KEY = "courseload.dailyLimit.v1";
  const PROFILE_KEY = "courseload.profile.v1";
  const $ = (id) => document.getElementById(id);
  const today = new Date(); today.setHours(0,0,0,0);
  const dateKey = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const parseDate = (value) => { const [y,m,d] = String(value).split("-").map(Number); return new Date(y,m-1,d); };
  const prettyDate = (value, options={weekday:"short",month:"short",day:"numeric"}) => value ? parseDate(value).toLocaleDateString(undefined,options) : "No date";
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const makeId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const read = (key, fallback) => { try { const value=localStorage.getItem(key); return value===null?fallback:JSON.parse(value); } catch { return fallback; } };
  let tasks = read(TASKS_KEY, []);
  if (!Array.isArray(tasks)) tasks = [];
  tasks = tasks.map(t => ({id:t.id || makeId(), title:t.title || t.name || "Untitled task", course:t.course || t.subject || "General", dueDate:t.dueDate || t.date || dateKey(today), hours:Number(t.hours ?? t.estimatedHours ?? 1), completed:Boolean(t.completed)}));
  let dailyLimit = Number(read(LIMIT_KEY, 4)) || 4;
  let profile = read(PROFILE_KEY, {name:"Student", university:"Your workspace", degree:"", semester:""});
  let currentView = "overview";
  const saveTasks = () => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  const saveLimit = () => localStorage.setItem(LIMIT_KEY, JSON.stringify(dailyLimit));
  const openModal = id => $(id).classList.add("open");
  const closeModal = id => $(id).classList.remove("open");
  const showToast = message => { $("toast").textContent=message; $("toast").classList.add("show"); window.clearTimeout(showToast.timer); showToast.timer=window.setTimeout(()=>$("toast").classList.remove("show"),2300); };
  const pending = () => tasks.filter(t=>!t.completed);
  const hours = list => list.reduce((sum,t)=>sum+(Number(t.hours)||0),0);
  const sortTasks = list => [...list].sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const initials = name => String(name||"Student").trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase() || "ST";

  function renderProfile(){
    $("sidebarName").textContent=profile.name||"Student";
    $("sidebarUniversity").textContent=profile.university||profile.degree||"Your workspace";
    $("profileInitials").textContent=initials(profile.name);
    $("studentName").value=profile.name||"";
    $("studentUniversity").value=profile.university||"";
    $("studentDegree").value=profile.degree||"";
    $("studentSemester").value=profile.semester||"";
    $("profileDailyLimit").value=dailyLimit;
  }
  function renderStats(){
    const open=pending(), due=open.filter(t=>t.dueDate===dateKey(today)), done=tasks.filter(t=>t.completed);
    $("openCount").textContent=open.length;
    $("todayCount").textContent=due.length;
    $("plannedHours").innerHTML=`${hours(open)} <small>hrs</small>`;
    $("completedCount").textContent=done.length;
    const weekEnd=new Date(today); weekEnd.setDate(weekEnd.getDate()+7);
    const week=open.filter(t=>{const d=parseDate(t.dueDate);return d>=today&&d<weekEnd;});
    $("weeklyHours").textContent=`${hours(week)} hrs`;
    $("weeklyTaskCount").textContent=`${week.length} task${week.length===1?"":"s"} this week`;
    $("weeklyDescription").textContent=week.length?`${week.length} upcoming task${week.length===1?"":"s"} across the next seven days.`:"A clear week ahead. Add tasks whenever something comes up.";
  }
  function taskRow(task){
    return `<div class="task-item ${task.completed?"completed":""}" data-task-row="${escapeHTML(task.id)}">
      <input class="check-task" type="checkbox" aria-label="Mark ${escapeHTML(task.title)} completed" data-complete="${escapeHTML(task.id)}" ${task.completed?"checked":""}>
      <div class="task-info"><div class="task-title">${escapeHTML(task.title)}</div><div class="task-meta">${escapeHTML(task.course)}</div></div>
      <span class="task-date">${prettyDate(task.dueDate)}</span><span class="task-hours">${Number(task.hours)||0}h</span>
      <button class="delete-btn" type="button" title="Edit task" aria-label="Edit task" data-edit="${escapeHTML(task.id)}">✎</button>
      <button class="delete-btn" type="button" title="Delete task" aria-label="Delete task" data-delete="${escapeHTML(task.id)}">×</button>
    </div>`;
  }
  function renderTasks(){
    const filter=$("taskFilter").value;
    let list=sortTasks(tasks);
    if(filter==="pending") list=list.filter(t=>!t.completed);
    if(filter==="completed") list=list.filter(t=>t.completed);
    $("taskList").innerHTML=list.map(taskRow).join("");
    $("emptyState").style.display=list.length?"none":"block";
    $("taskList").style.display=list.length?"block":"none";
    $("taskPanelTitle").textContent=currentView==="tasks"?"All your tasks":"Upcoming tasks";
  }
  function renderWorkload(){
    const days=[];
    for(let i=0;i<7;i++){const d=new Date(today);d.setDate(today.getDate()+i);const key=dateKey(d);const dayTasks=pending().filter(t=>t.dueDate===key);days.push({key,label:i===0?"Today":i===1?"Tomorrow":prettyDate(key),total:hours(dayTasks),count:dayTasks.length});}
    $("workloadList").innerHTML=days.map(d=>{
      const pct=Math.min(100,d.total/Math.max(1,dailyLimit)*100), over=d.total>dailyLimit;
      return `<div class="load-row"><div class="load-top"><span class="load-date">${d.label}</span><span class="load-hours">${d.total} / ${dailyLimit} hrs · ${d.count} task${d.count===1?"":"s"}</span></div><div class="load-track"><div class="load-fill ${over?"over":""}" style="width:${pct}%"></div></div>${over?'<div class="load-warning">Above your daily limit — consider moving some work earlier.</div>':""}</div>`;
    }).join("");
    if(!days.some(d=>d.count)) $("workloadList").innerHTML='<div class="load-clear">No upcoming deadlines in the next seven days. Enjoy the breathing room.</div>';
  }
  function renderAdvice(){
    const open=pending(), overloaded=[];
    for(let i=0;i<7;i++){const d=new Date(today);d.setDate(today.getDate()+i);const total=hours(open.filter(t=>t.dueDate===dateKey(d)));if(total>dailyLimit)overloaded.push(d);}
    const upcoming=sortTasks(open).filter(t=>parseDate(t.dueDate)>=today);
    if(!open.length){$("adviceTitle").textContent="A well-earned breather";$("adviceText").textContent="No pending tasks right now. Enjoy the progress you've made, and add your next task when you're ready.";return;}
    if(overloaded.length){$("adviceTitle").textContent="One day looks overloaded";$("adviceText").textContent="You have more planned hours than your daily limit on at least one day. Move part of that work to an earlier, lighter day if you can.";return;}
    if(upcoming.length>=3){$("adviceTitle").textContent="Keep an eye on your deadlines";$("adviceText").textContent="Several tasks are coming up. Start with the nearest deadline, then work through the rest one step at a time.";return;}
    $("adviceTitle").textContent="You're building momentum";$("adviceText").textContent="Your workload looks manageable. A short study session today can make the next deadline easier.";
  }
  const reminderMessages = {
    fresh: [
      "A blank page is a chance to build a better week. Add your first task when you're ready.",
      "No deadlines on the board yet. Take a breath, then make a plan when you need one.",
      "Every organised semester starts with one small step. You've got this."
    ],
    overdue: [
      "One deadline has slipped past. Don't panic; choose the smallest next step and get moving.",
      "Yesterday is gone. Give the overdue task a little attention today and regain control.",
      "No guilt spiral. Check what's overdue, make a realistic plan, and start there."
    ],
    overloaded: [
      "Your schedule is carrying a lot. Move one task to a lighter day if you can.",
      "You don't have to do everything at once. Spread the workload before it piles up.",
      "A packed day isn't a challenge to your worth. Make the plan realistic, not punishing."
    ],
    today: [
      "Something is due today. Give it a focused session before the day gets away from you.",
      "Today's deadline deserves first attention. Start with a small, manageable work block.",
      "One thing at a time: tackle today's task, then think about what's next."
    ],
    clear: [
      "Your checklist is clear. Enjoy the breathing room; you've earned it.",
      "Nothing pending right now. Rest is part of making progress sustainable.",
      "An empty task list is a lovely sight. Keep that momentum without rushing."
    ],
    progress: [
      "You've already crossed a few things off. Let that progress carry you into the next task.",
      "Look at the work you've finished. Small wins are still wins.",
      "Keep the momentum gentle and steady. You're getting there."
    ],
    steady: [
      "A little progress today can make tomorrow feel much lighter.",
      "You don't need a perfect study day. Just give the next task a proper start.",
      "Consistency beats a last-minute sprint. Keep showing up for yourself."
    ]
  };
  let reminderCategory = "";
  let reminderIndex = 0;
  function updateSidebarReminder(rotate = false){
    const open = pending();
    const overdue = open.some(t => parseDate(t.dueDate) < today);
    let overloaded = false;
    for(let i=0;i<7;i++){
      const d=new Date(today);d.setDate(today.getDate()+i);
      if(hours(open.filter(t=>t.dueDate===dateKey(d)))>dailyLimit){overloaded=true;break;}
    }
    const dueToday = open.some(t=>t.dueDate===dateKey(today));
    let category = "steady";
    if(!tasks.length) category = "fresh";
    else if(overdue) category = "overdue";
    else if(overloaded) category = "overloaded";
    else if(dueToday) category = "today";
    else if(!open.length) category = "clear";
    else if(tasks.some(t=>t.completed)) category = "progress";
    if(category !== reminderCategory){reminderCategory=category;reminderIndex=0;}
    else if(rotate){reminderIndex=(reminderIndex+1)%reminderMessages[category].length;}
    $("sidebarTip").querySelector(".side-note-copy").textContent=reminderMessages[category][reminderIndex];
    $("sidebarTip").querySelector(".side-note-action").textContent="Another little reminder →";
  }

  function render(){
    renderStats();renderTasks();renderWorkload();renderAdvice();renderProfile();updateSidebarReminder();
    $("dailyLimitInput").value=dailyLimit;
    document.querySelectorAll("[data-view]").forEach(a=>{a.classList.toggle("active",a.dataset.view===currentView);a.setAttribute("aria-current",a.dataset.view===currentView?"page":"false");});
    $("mainContent").className=`main-content view-${currentView}`;
    const titles={overview:["Good to see you","Here's what's happening with your academic workload."],tasks:["My tasks","Everything you've got on your academic plate."],workload:["Workload","See where your study hours are landing this week."]};
    $("pageTitle").innerHTML=`${titles[currentView][0]}<span class="wave">.</span>`;$("pageSubtitle").textContent=titles[currentView][1];
  }
  function navigate(view){
    if(!["overview","tasks","workload"].includes(view))view="overview";
    currentView=view;render();
    if(location.hash!==`#${view}`)history.pushState({view}, "", `#${view}`);
  }
  function addTask(){
    $("taskForm").reset();$("editTaskId").value="";$("taskModalTitle").textContent="Add a task";$("saveTaskButton").textContent="Save task";$("taskDate").value=dateKey(today);$("taskHours").value="2";openModal("taskModalBackdrop");
  }
  function editTask(id){
    const t=tasks.find(x=>x.id===id);if(!t)return;
    $("editTaskId").value=t.id;$("taskName").value=t.title;$("taskCourse").value=t.course;$("taskDate").value=t.dueDate;$("taskHours").value=t.hours;
    $("taskModalTitle").textContent="Edit task";$("saveTaskButton").textContent="Update task";openModal("taskModalBackdrop");
  }
  function detailList(list, empty){
    if(!list.length)return `<div class="detail-empty">${empty}</div>`;
    return sortTasks(list).map(taskRow).join("");
  }
  function openStat(kind){
    const open=pending(),done=tasks.filter(t=>t.completed);
    let title="",list=[],summary="";
    if(kind==="open"){title="Open tasks";list=open;summary=`<div class="detail-total"><span>Tasks still to complete</span><strong>${list.length}</strong></div>`;}
    if(kind==="today"){title="Due today";list=open.filter(t=>t.dueDate===dateKey(today));summary=`<div class="detail-total"><span>Estimated study time today</span><strong>${hours(list)} hrs</strong></div>`;}
    if(kind==="hours"){title="Planned study hours";list=open;summary=`<div class="detail-total"><span>Total estimated time across open tasks</span><strong>${hours(list)} hrs</strong></div>`;}
    if(kind==="completed"){title="Completed tasks";list=done;summary=`<div class="detail-total"><span>Tasks you've completed</span><strong>${list.length}</strong></div>`;}
    $("detailTitle").textContent=title;$("detailSummary").innerHTML=summary;$("detailContent").innerHTML=detailList(list,"Nothing to show here just yet.");
    $("detailViewAll").style.display="";openModal("detailModalBackdrop");
  }
  function openWeek(){
    const end=new Date(today);end.setDate(end.getDate()+7);
    const list=sortTasks(pending().filter(t=>{const d=parseDate(t.dueDate);return d>=today&&d<end;}));
    const total=hours(list);
    $("weeklyModalSummary").innerHTML=`<div class="weekly-modal-summary"><div><span>Tasks due in the next seven days</span><br><strong>${list.length} tasks</strong></div><div><span>Estimated study time</span><br><strong>${total} hours</strong></div></div>`;
    const groups={};list.forEach(t=>(groups[t.dueDate]??=[]).push(t));
    $("weeklyModalContent").innerHTML=list.length?Object.entries(groups).map(([day,items])=>`<div class="week-day"><h3>${prettyDate(day,{weekday:"long",month:"long",day:"numeric"})}</h3>${items.map(t=>`<div class="week-task"><div><strong>${escapeHTML(t.title)}</strong><small>${escapeHTML(t.course)}</small></div><span>${t.hours}h</span></div>`).join("")}</div>`).join(""):'<div class="detail-empty">Your next seven days are clear. Add a task when a new deadline comes in.</div>';
    openModal("weeklyModalBackdrop");
  }
  $("taskForm").addEventListener("submit",e=>{
    e.preventDefault();
    const id=$("editTaskId").value;
    const task={id:id||makeId(),title:$("taskName").value.trim(),course:$("taskCourse").value.trim(),dueDate:$("taskDate").value,hours:Number($("taskHours").value),completed:id?(tasks.find(t=>t.id===id)?.completed||false):false};
    if(!task.title||!task.course||!task.dueDate||!Number.isFinite(task.hours)||task.hours<=0)return;
    if(id)tasks=tasks.map(t=>t.id===id?task:t);else tasks.push(task);
    saveTasks();closeModal("taskModalBackdrop");render();showToast(id?"Task updated":"Task added to your workspace");
  });
  $("taskList").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
    if(edit)editTask(edit.dataset.edit);
    if(del){tasks=tasks.filter(t=>t.id!==del.dataset.delete);saveTasks();render();showToast("Task deleted");}
  });
  $("taskList").addEventListener("change",e=>{
    const check=e.target.closest("[data-complete]");if(!check)return;
    tasks=tasks.map(t=>t.id===check.dataset.complete?{...t,completed:check.checked}:t);saveTasks();render();
  });
  $("detailContent").addEventListener("click",e=>{
    const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");
    if(edit){closeModal("detailModalBackdrop");editTask(edit.dataset.edit);}
    if(del){tasks=tasks.filter(t=>t.id!==del.dataset.delete);saveTasks();render();openStat("open");}
  });
  $("detailContent").addEventListener("change",e=>{
    const check=e.target.closest("[data-complete]");if(!check)return;
    tasks=tasks.map(t=>t.id===check.dataset.complete?{...t,completed:check.checked}:t);saveTasks();render();openStat("open");
  });
  $("taskFilter").addEventListener("change",renderTasks);
  $("addTaskTop").addEventListener("click",addTask);$("emptyAdd").addEventListener("click",addTask);
  document.querySelectorAll("[data-stat]").forEach(el=>el.addEventListener("click",()=>openStat(el.dataset.stat)));
  document.querySelectorAll("[data-view]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();navigate(el.dataset.view);}));
  window.addEventListener("popstate",()=>{currentView=location.hash.slice(1)||"overview";render();});
  $("saveLimit").addEventListener("click",()=>{const value=Number($("dailyLimitInput").value);if(!Number.isFinite(value)||value<1||value>24){showToast("Choose a limit between 1 and 24 hours");return;}dailyLimit=value;saveLimit();render();showToast("Daily study limit saved");});
  $("openProfile").addEventListener("click",()=>{renderProfile();openModal("profileModalBackdrop");});
  $("profileForm").addEventListener("submit",e=>{
    e.preventDefault();profile={name:$("studentName").value.trim()||"Student",university:$("studentUniversity").value.trim()||"Your workspace",degree:$("studentDegree").value.trim(),semester:$("studentSemester").value.trim()};
    const limit=Number($("profileDailyLimit").value);if(Number.isFinite(limit)&&limit>=1&&limit<=24)dailyLimit=limit;
    localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));saveLimit();closeModal("profileModalBackdrop");render();showToast("Workspace profile saved");
  });
  $("planWeek").addEventListener("click",openWeek);
  $("detailViewAll").addEventListener("click",()=>{closeModal("detailModalBackdrop");navigate("tasks");});
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
  document.querySelectorAll(".modal-backdrop").forEach(backdrop=>backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop.open").forEach(m=>closeModal(m.id));});
  $("sidebarTip").addEventListener("click",()=>{updateSidebarReminder(true);});
  $("dateLabel").textContent=today.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
  if(location.hash==="#tasks"||location.hash==="#workload")currentView=location.hash.slice(1);
  render();
})();