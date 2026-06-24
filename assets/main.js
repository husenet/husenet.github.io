/* husenet // interactive terminal - a browsable filesystem of public projects */
(function () {
  "use strict";

  var output = document.getElementById("output");
  var input = document.getElementById("cmd");
  var form = document.getElementById("form");
  var cursor = document.getElementById("cursor");
  var mirror = document.getElementById("mirror");
  var PROMPT = "jake@husenet:~$";

  var history = [];
  var hidx = 0;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function link(u) {
    return '<a class="link" href="https://' + u + '" target="_blank" rel="noopener">' + u + "</a>";
  }
  function cmdlink(label, cmd) {
    return '<span class="cmd-link" data-cmd="' + esc(cmd) + '" role="button" tabindex="0">' + label + "</span>";
  }
  function scrollDown() { output.scrollTop = output.scrollHeight; }

  function write(html, cls) {
    var d = document.createElement("div");
    d.className = "line" + (cls ? " " + cls : "");
    d.innerHTML = html == null ? "" : html;
    output.appendChild(d);
    scrollDown();
  }
  function writeLines(lines, cls) {
    write(Array.isArray(lines) ? lines.join("\n") : lines, cls);
  }
  function printCommand(raw) {
    write('<span class="p">' + esc(PROMPT) + '</span> <span class="echo">' + esc(raw) + "</span>");
  }

  /* ---- the "filesystem": public projects ---- */
  var projects = [
    {
      name: "vantage",
      lang: "python",
      short: "web security scanner",
      url: "github.com/husenet/vantage",
      desc: [
        "web security scanner for authorized testing.",
        "http security-header / cookie / cors / disclosure audit,",
        "csp + hsts analysis, http-method probing, dns recon, and",
        "nmap service + vulners (cve) scans. selectable by flag,",
        "report-friendly output. python stdlib, zero dependencies."
      ]
    },
    {
      name: "promptstrike",
      lang: "python",
      short: "llm red-teaming toolkit",
      url: "github.com/husenet/promptstrike",
      desc: [
        "llm red-teaming toolkit. probes llm apps for prompt injection,",
        "jailbreaks, system-prompt leakage, and data disclosure, mapped",
        "to the OWASP LLM Top 10. zero dependencies, runs offline."
      ]
    }
  ];
  function findProject(n) {
    n = (n || "").replace(/\/$/, "").toLowerCase();
    for (var i = 0; i < projects.length; i++) if (projects[i].name === n) return projects[i];
    return null;
  }

  var banner = [
    "     ██╗ █████╗ ██╗  ██╗███████╗",
    "     ██║██╔══██╗██║ ██╔╝██╔════╝",
    "     ██║███████║█████╔╝ █████╗  ",
    "██   ██║██╔══██║██╔═██╗ ██╔══╝  ",
    "╚█████╔╝██║  ██║██║  ██╗███████╗",
    " ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝"
  ];

  var help = [
    "available commands:",
    '  <span class="kw">ls</span>            list projects',
    '  <span class="kw">cat</span> &lt;name&gt;    show a project',
    '  <span class="kw">open</span> &lt;name&gt;   open a project on github',
    '  <span class="kw">github</span>        my github profile',
    '  <span class="kw">clear</span>         clear the screen',
    '  <span class="kw">help</span>          this list',
    "",
    '<span class="dim">tip: click a project, Tab autocompletes, Up/Down recalls history.</span>'
  ];

  function pad(s, n) {
    s = String(s);
    while (s.length < n) s += " ";
    return s;
  }

  /* ---- commands ---- */
  var commands = {
    help: function () { writeLines(help); },
    ls: function () {
      write('<span class="dim">~/projects</span>');
      write("");
      projects.forEach(function (p) {
        var name = cmdlink(pad(p.name + "/", 16), "cat " + p.name);
        write(name + '<span class="dim">' + p.short + "  [" + p.lang + "]</span>");
      });
    },
    cat: function (a) {
      var p = findProject(a[0]);
      if (!a[0]) { write("usage: cat &lt;project&gt;  (try " + cmdlink("ls", "ls") + ")", "err"); return; }
      if (!p) { write("cat: " + esc(a[0]) + ": no such project. " + cmdlink("ls", "ls") + " to list.", "err"); return; }
      write('<span class="kw">' + p.name + "/</span>   [" + p.lang + "]");
      write("");
      writeLines(p.desc, "out");
      write("");
      write("  open  " + link(p.url));
    },
    open: function (a) {
      var p = findProject(a[0]);
      if (!p) { write("open: " + esc(a[0] || "") + ": no such project.", "err"); return; }
      window.open("https://" + p.url, "_blank", "noopener");
      write("opening " + link(p.url) + " ...");
    },
    github: function () {
      window.open("https://github.com/husenet", "_blank", "noopener");
      write("opening " + link("github.com/husenet") + " ...");
    },
    whoami: function () { write("husenet"); },
    banner: function () { write('<pre class="banner">' + esc(banner.join("\n")) + "</pre>"); },
    clear: function () { output.innerHTML = ""; },
    sudo: function () { write("user is not in the sudoers file. this incident will be reported.", "err"); },
    exit: function () { write("you can log out, but the shell stays open. (it's a website.)", "dim"); }
  };

  var ALIASES = { "?": "help", "ll": "ls", "cls": "clear", "man": "help", "projects": "ls", "cd": "cat" };

  function run(raw) {
    printCommand(raw);
    var line = raw.trim();
    if (!line) return;
    history.push(line);
    hidx = history.length;
    var parts = line.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (ALIASES[cmd]) cmd = ALIASES[cmd];
    if (commands[cmd]) commands[cmd](args);
    else write("command not found: " + esc(parts[0]) + '. type <span class="kw">help</span>.', "err");
  }

  /* run a command without the user typing (used by clickable entries) */
  function runProgrammatic(cmdStr) {
    run(cmdStr);
    input.focus();
  }

  /* ---- block cursor ---- */
  function updateCursor() {
    mirror.textContent = input.value;
    cursor.style.transform = "translateX(" + mirror.offsetWidth + "px)";
  }
  input.addEventListener("input", updateCursor);
  input.addEventListener("focus", function () { cursor.classList.remove("off"); updateCursor(); });
  input.addEventListener("blur", function () { cursor.classList.add("off"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value;
    input.value = "";
    updateCursor();
    run(v);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hidx > 0) { hidx--; input.value = history[hidx] || ""; updateCursor(); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hidx < history.length) { hidx++; input.value = history[hidx] || ""; updateCursor(); }
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.ctrlKey && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      output.innerHTML = "";
    }
  });

  function complete() {
    var v = input.value.trim();
    if (!v) return;
    var pool = Object.keys(commands).concat(projects.map(function (p) { return p.name; }));
    if (v.indexOf(" ") >= 0) {
      var bits = v.split(/\s+/);
      var last = bits[bits.length - 1];
      var pm = projects.map(function (p) { return p.name; }).filter(function (n) { return n.indexOf(last) === 0; });
      if (pm.length === 1) { bits[bits.length - 1] = pm[0]; input.value = bits.join(" "); updateCursor(); }
      return;
    }
    var matches = pool.filter(function (n) { return n.indexOf(v) === 0; });
    if (matches.length === 1) { input.value = matches[0] + " "; updateCursor(); }
    else if (matches.length > 1) { printCommand(input.value); write(matches.sort().join("   ")); }
  }

  /* clickable filesystem entries */
  output.addEventListener("click", function (e) {
    var el = e.target.closest("[data-cmd]");
    if (el) { e.preventDefault(); runProgrammatic(el.getAttribute("data-cmd")); }
  });
  output.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest("[data-cmd]");
    if (el) { e.preventDefault(); runProgrammatic(el.getAttribute("data-cmd")); }
  });

  /* focus input on click, but don't fight text selection or clickable entries */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cmd]") || e.target.closest("a")) return;
    if (String(window.getSelection())) return;
    input.focus();
  });

  /* ---- boot ---- */
  write('<pre class="banner">' + esc(banner.join("\n")) + "</pre>");
  write('<span class="dim">husenet</span>');
  write("");
  commands.ls();
  write("");
  write('type <span class="kw">help</span>, or click a project.');
  write("");
  input.focus();
  updateCursor();
})();
