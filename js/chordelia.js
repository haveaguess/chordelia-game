// keep it namespaced - see return at bottom
var chordelia = (function() {
	// boo sound -lazy init
	var boo;

	var chart;
	var chart2;
	var legend;

	var chordQueue = new Array();
	var currentProgression = 0;

	// associative array of Note -> StopPlayingCallback or false if not playing
	var playingNotes = new Array;

	// synth is associative array Note -> PlayCallback
	var synth = new Array;
	for (var i in newNotes) {
		synth[i] = playNote[newNotes[i]];
	}

	var delay = 0; // play one note every quarter second
	var note = 50; // the MIDI note
	var velocity = 127; // how hard the note hits

	// from tap tempo - http://www.all8.com/tools/bpm.htm
	// var bpm = 90.26;
	var bpm = 87;
	var secondsPerBeat = 60/bpm;

	// one bar is a full round
	var beatsPerRound = 4;
	var secondsPerRound = secondsPerBeat * beatsPerRound;

	 // http://www.musicmasterworks.com/WhereMathMeetsMusic.html
	var newNotes = {
		C : 48,
		D : 50,
		E : 52,
		F : 53,
		G : 55,
		A : 57,
		B : 59
	};

	var progression = [ [3,5,0], [3,5,6], [2,4,6], [4,0], [3,0], [3,6], [5,0,2], [6,1,3] ];

	var noteToSliceIndex = {
		A : 0,
		B : 1,
		C : 2,
		D : 3,
		E : 4,
		F : 5,
		G : 6
	};

	var chartData = [{
		country: "A",
		semitone: 1
	}, {
		country: "B",
		semitone: 1
	}, {
		country: "C",
		semitone: 1
	}, {
		country: "D",
		semitone: 1
	}, {
		country: "E",
		semitone: 1
	}, {
		country: "F",
		semitone: 1
	}, {
		country: "G",
		semitone: 1
	}];

	var currentNotes = null;

	function clickSlice(slice) {
		var note = slice.dataItem.title;

		if (playingNotes[note]) {
			stopNote(note);
		} else {
			// queue up play and reset of note
			chordQueue[note] = function() {
				// play note
				playNote(note); 

				// check for num note
				bumNote(note);

				// then reset it for next bar
				chart.clickSlice(noteToSliceIndex[note]);
				stopNote(note);
			};
		}
	}

	// bit messy goes back to cheeck progression was right
	function bumNote(note) {
		var correctProgression = currentProgression - 2;

		if (correctProgression < 0) {
			correctProgression = progression.length + correctProgression;
		}

		if ($.inArray(noteToSliceIndex[note], progression[correctProgression]) == -1) {
			boo = new Audio("boo.wav");
			boo.play();
		}
	}

	function stopNote(note) {
		// stop the note using stored callback
		//playingNotes[note]();
		if (playingNotes[note]) {
			playingNotes[note]();
			playingNotes[note] = false;
		}
		chordQueue[note] = function() {};
	}

	function playNote(note) {
		var freq = newNotes[note];

		MIDI.noteOn(0, freq, velocity, delay);

		// track which newNotes are playing, by registering noteoff callback
		playingNotes[note] = function() {
			MIDI.noteOff(0, freq, delay + 0.75);
		}
	}

	function initRaphael() {
		var r = Raphael("holder", 600, 600),
			R = 200,
			param = {stroke: "#fff", "stroke-width": 30};
		// Custom Attribute
		r.customAttributes.arc = function (value, total, R) {
			var alpha = 360 / total * value,
				a = (90 - alpha) * Math.PI / 180,
				x = 300 + R * Math.cos(a),
				y = 300 - R * Math.sin(a),
				color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)"),
				path;
			if (total == value) {
				path = [["M", 300, 300 - R], ["A", R, R, 0, 1, 1, 299.99, 300 - R]];
			} else {
				path = [["M", 300, 300 - R], ["A", R, R, 0, +(alpha > 180), 1, x, y]];
			}
			return {path: path, stroke: color};
		};

		drawMarks(r, R, beatsPerRound);
		var sec = r.path().attr(param).attr({arc: [0, beatsPerRound, R]});
	//                var mon = r.path().attr(param).attr({arc: [0, 12, R]});
		//var pm = r.circle(300, 300, 16).attr({stroke: "none", fill: Raphael.hsb2rgb(15 / 200, 1, .75).hex});
		// html[0].style.color = Raphael.hsb2rgb(15 / 200, 1, .75).hex;

		return sec;
	}

	function drawMarks(r, R, total) {
		var marksAttr = {fill: hash || "#444", stroke: "none"},
			hash = document.location.hash;
		var color = "hsb(".concat(Math.round(R) / 200, ", 1, .75)"),
			out = r.set();
		for (var value = 0; value < total; value++) {
			var alpha = 360 / total * value,
				a = (90 - alpha) * Math.PI / 180,
				x = 300 + R * Math.cos(a),
				y = 300 - R * Math.sin(a);
			out.push(r.circle(x, y, 2).attr(marksAttr));
		}
		return out;
	}


	function updateVal(html, init, value, total, R, hand, id) {
		var color = "hsb(".concat(Math.round(R) / 200, ",", value / total, ", .75)");
		if (init) {
			hand.animate({arc: [value, total, R]}, 900, ">");
		} else {
			if (!value || value == total) {
				value = total;
				hand.animate({arc: [value, total, R]}, 750, "bounce", function () {
					hand.attr({arc: [0, total, R]});
				});
			} else {
				hand.animate({arc: [value, total, R]}, 750, "elastic");
			}
		}
		var countDownValue = total - value;
		html[id].innerHTML = (countDownValue < 10 ? "0" : "") + countDownValue;
		html[id].style.color = Raphael.getRGB(color).hex;
	}

	function prettyPrintArray(assocArray) {
		var returnVal = "";
		for(var index in assocArray) {
		  returnVal= returnVal +  index + " : " + assocArray[index] + "<br />";
		}

		return returnVal;
	}

	function startMusic(callback) {
		MIDI.loadPlugin({
			soundfontUrl: "js/MIDI.js/soundfont/",
			instrument: "acoustic_grand_piano",
			callback: function() {
				var delay = 0; // play one note every quarter second
				var note = 50; // the MIDI note
				var velocity = 127; // how hard the note hits

				MIDI.setVolume(0, 127);


				// http://www.madore.org/~david/music/midi/
				var file = "prelC.mid";

// file = "http://chordelia.comli.com/game/samples/prelC.mid";
				if (document.location.hostname.indexOf("file://") != -1) {
					file = "prelC.mid";
				}

				MIDI.Player.loadFile(file, function() {
					MIDI.Player.start();
					callback();
				});
			}
		});
	}

	// only function we expose to users of 'chordelia' API
	// onload init charts and trigger nextChord()
	var initialise = function() {

		// setup pie charts
		AmCharts.ready(function () {
			// PIE CHART
			chart = new AmCharts.AmPieChart();
			chart.dataProvider = chartData;
			chart.titleField = "country";
			chart.valueField = "semitone";
			chart.outlineColor = "#FFFFFF";
			chart.labelsEnabled = false;
			chart.balloonText = "[[title]]";
			chart.outlineAlpha = 0.8;
			chart.outlineThickness = 2;

			// add click listener
			chart.addListener("clickSlice", clickSlice)

			// WRITE
			chart.write("chartdiv");
			// WRITE

			// PIE CHART
			chart2 = new AmCharts.AmPieChart();
			chart2.dataProvider = chartData;
			chart2.titleField = "country";
			chart2.valueField = "semitone";
			chart2.outlineColor = "#FFFFFF";
			chart2.labelsEnabled = false;
			chart2.balloonText = "[[title]]";
			chart2.outlineAlpha = 0.5;
			chart2.outlineThickness = 20;

			// WRITE
			chart2.write("chartdiv2");

			//start the music
			startMusic(startGame);
		});
	}

	// show user next chord, using minimal animatons of slices
	function nextChord() {
		var newNotes = progression[currentProgression];
		
		// add slices in new chord, that arent in old one
		for (var i in newNotes) {
			// if not already selected then select
			if (currentNotes == null || $.inArray(newNotes[i], currentNotes) == -1) {
				chart2.clickSlice(newNotes[i]);
			} 
		}

		// deselect newNotes in old one that arent in new chord
		for (var i in currentNotes) {
			if ($.inArray(currentNotes[i], newNotes) == -1) {
				chart2.clickSlice(currentNotes[i]);
			} 
		}

		currentProgression = (currentProgression + 1) % progression.length;
		currentNotes = newNotes;

		playChord();
	}

	function playChord() {
		for (var i in chordQueue) {
		  chordQueue[i]();
		  chordQueue[i] = function() {};
		}
	}

	function startGame() {
		var html = [
				document.getElementById("s")
			];
		var sec = initRaphael();
		var init = true;
		var now = new Date;
		var currentBeat = 1;
		var debug = true;

		// first chord
		nextChord();

		// Main game loop - once per beat
		(function () {

			// var d = new Date;
			// var secsPassedSinceStart = Math.round((d.getTime()-startSecs)/1000);
			updateVal(html, init, currentBeat, beatsPerRound, 200, sec, 0);
			
			// debug logging 
			if (debug) {
				$("#debug").html(
					"currentBeat: " + currentBeat + "<br>" +
					"playingNotes: " + playingNotes + "<br>" +
					"playNote: " + playNote + "<br>" +
					"chordQueue: " + prettyPrintArray(chordQueue) + "<br>" +
					"currnetProgession: "  + prettyPrintArray(progression[currentProgression]) + "<br>" +
					"secondsPerBeat: " + secondsPerBeat 
				);
			}

			if (currentBeat < beatsPerRound) {
				currentBeat++;
			} else {
				currentBeat = 1;
				nextChord();

				// chart.animateAgain();
				// chart2.animateAgain();
			}

			init = false;

			// deferred recurse this anonymous function
			setTimeout(arguments.callee, secondsPerBeat*1000);
		})();
	}

	// only share the functions needed to use "API"
	return {
		initialise: initialise
	}
})();