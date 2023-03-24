// Apply labels to everything, even new things that get added
document.querySelectorAll(".screened").forEach(elem => elem.title = "Screened")
document.querySelectorAll(".range").forEach(elem => elem.title = "Range")
document.querySelectorAll(".valid").forEach(elem => elem.title = "Validity Flag")
document.querySelectorAll(".changed").forEach(elem=>elem.title = "Changed Flag")
document.querySelectorAll(".repl-cause").forEach(elem => elem.title = "Replacement Cause")
document.querySelectorAll(".repl-method").forEach(elem => elem.title = "Replacement Method")
document.querySelectorAll(".test-failed").forEach(elem => elem.title = "Test Failed")
document.querySelectorAll(".protected").forEach(elem => elem.title = "Protected Flag")