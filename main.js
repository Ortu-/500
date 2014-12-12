
//Define Application Namespace//

function App_FiveHundred(params) {
	
	//App Init -------------------------------------------------------------
	
	var app = this;
	
	this.skin = params.skin;

	this.suitVal = {"Spades": 1, "Clubs": 2, "Diamonds": 3, "Hearts": 4, "Joker": 5};
	
	this.baseSchedule = [];
		for(var i = 6; i < 10; i++){
			this.baseSchedule.push(i + " Spades");
			this.baseSchedule.push(i + " Clubs");
			this.baseSchedule.push(i + " Diamonds");
			this.baseSchedule.push(i + " Hearts");
			this.baseSchedule.push(i + " No-Trump");
		}

	this.phase = "";
	
	
	//build ui elements -------------------------------------------------------
	
	this.buildElements = function(){

		//cards
		for(var v = 2; v <= 16; v++){
			var t = $('#field').html();
			t += '<div id="card-S' + v + '" class="card" ><img src="img/cards/'+app.skin+'/s'+v+'.jpg" /></div>';
			t += '<div id="card-C' + v + '" class="card" ><img src="img/cards/'+app.skin+'/c'+v+'.jpg" /></div>';
			t += '<div id="card-D' + v + '" class="card" ><img src="img/cards/'+app.skin+'/d'+v+'.jpg" /></div>';
			t += '<div id="card-H' + v + '" class="card" ><img src="img/cards/'+app.skin+'/h'+v+'.jpg" /></div>';
			$('#field').html(t);
			
			$('#card-S' + v).hide();
			$('#card-C' + v).hide();
			$('#card-D' + v).hide();
			$('#card-H' + v).hide();
		}
		
		var t = $('#field').html();
		t += '<div id="card-J17" class="card" ><img src="img/cards/'+app.skin+'/j17.jpg" /></div>';
		$('#field').html(t);	
		
		$('#card-J17').hide();
	}
	
	//input handler --------------------------------------------------------
	
	this.bindHandlers = function(){
		
		//Enter Key
		$(document).on("keydown", function (e) {
			if (e.which === 13) {
				//$('#' + currentFocus).click();
				
				//start a game
				$('#main').html('starting');
				var thisGame = new app.Game('Easy');
			}
		});	
		
		//Card Clicks
		$(function(){
			$(".card").click(function(e) {
				
				var cid = $(this).attr('id').substr(5, 2);
				
				switch(app.phase){
					case "kitty":
					
						// !!! stub !!! execute trade between kitty and hand.
					
						break;
						
					case "play":
						
						// !!! stub !!! play a card from hand to current trick.
						
						break;
						
					default:
					
						//ignore.
						
						break;
						
				}
				
			});
		});		
		
		app.log("Application Loaded");
		
	}
	
	
	
	//Game Class ------------------------------------------------------------
	
	this.Game = function (difficulty){
		
		app.log("\r\nStarting a new game on mode: " + difficulty);
		
		//Game Init - - - - - - - - - - - - - - - - - -
		
		var g = this;
		
		this.aiMode = difficulty
		
		this.winner = 0;
		this.roundCount = 0;
		this.dealer = -1
	
		this.players = [];
		this.deck = [];	
	
	
	
		//Define Game Methods - - - - - - - - - - - - - 
		
		this.shuffle = function(){
			
			app.log("Shuffling...");
			
			//build the deck
			g.deck = [];
			for(var v = 2; v <= 14; v++){
				g.deck.push(new app.Card("Spades", v));
				g.deck.push(new app.Card("Clubs", v));
				g.deck.push(new app.Card("Diamonds", v));
				g.deck.push(new app.Card("Hearts", v));
			}
			g.deck.push(new app.Card("Joker", 17));
			
			//shuffle it
			for(var c = 0; c < g.deck.length; c++){
				var thisCard = g.deck[c];
				var newSpot = app.getRnd(0, 52);
				g.deck.splice(c, 1);
				g.deck.splice(newSpot, 0, thisCard);
			}
			
			var t = "";
			for(var c = 0; c < g.deck.length; c++){
				t += g.deck[c].toString() + ", ";
			}
			app.log(t);
			
		}	
		
		
		
		this.deal = function(){
		
			app.log("\r\nDealing the hand...");
			
			var count = 0;
			
			//deal in 3-2-3-2 pattern with 3 remainder to kitty
			for(var c = 0; c < g.deck.length; c++){
				
				var thisCard = g.deck[c];
				var thisPlayer = Math.floor(count / 10);
				
				if(thisPlayer < 5){
					g.players[thisPlayer].hand.push(new app.Card(thisCard.suit, thisCard.value));	
					count++;
				}
			}
			
			//sort the hands
			for(var p = 0; p < g.players.length; p++){
				var thisPlayer = g.players[p];
				thisPlayer.sortHand("weight");
			}
			
		}
		

		//Execute on Construct - - - - - - - - - - - - -
		
		//add players using specified difficulty
		
		app.log("\r\nAdding players...");
		
		var aiOption = [];
		
		switch(difficulty){
			case "Easy": aiOption = ['Easy']; break;
			case "Hard": aiOption = ['Hard']; break;
			case "Mixed": aiOption = ['Easy', 'Hard']; break;
		}
		
		//AI only play 
		/*for (var i = 0; i < 5; i++){
			this.players[i] = new app.Player(aiOption[app.getRnd(0, aiOption.length - 1)]);

			app.log("Made Player: " + i + " (" + g.players[i].name + ")");
		}*/
		
		
		//Single player
		
		for (var i = 0; i < 4; i++){
			this.players[i] = new app.Player(aiOption[app.getRnd(0, aiOption.length - 1)]);

			app.log("Made Player: " + i + " (" + g.players[i].name + ")");
		}

		this.players[4] = new app.Player("Human");
		
		app.log("Made Player: 4 (" + g.players[4].name + ")");
		
		
		//start round 1
		var thisRound = new app.GameRound(g);
		
	}
	
	
	
	//GameRound Class ------------------------------------------------------------
	
	this.GameRound = function(g){
	
		app.log("\r\nStarting Round " + (g.roundCount + 1));
		
		//GameRound Init - - - - - - - - - - - - - 
		
		var thisRound = this;
		
		this.passCount = 0;
		this.bidCount = 0;
		this.seatCount = 1;	
		this.trickCount = 0;
		this.topBidAmount = 0;
		this.topBidSuit = "";
		this.topBidPlayer = -1;
		this.chief = -1;
		this.vice1 = -1;
		this.vice2 = -1;
		this.viceLimit = 0;
		this.trumpSuit = "";
		this.nextLeadPlayer = -1;	
		
		this.topInSuit = {
			"Spades": "AS", 
			"Clubs": "AC", 
			"Diamonds": "AD", 
			"Hearts": "AH"
		};
		
		this.outOfSuit = {	
			"Spades": [false, false, false, false, false], 
			"Clubs": [false, false, false, false, false],
			"Diamonds": [false, false, false, false, false],
			"Hearts": [false, false, false, false, false]
		};
						
		this.playerBids = [];
		
		
		
		//Define GameRound Methods - - - - - - - - - - - - - 
		
		this.runBidPhase = function(g){
		
			app.phase = "bid";
			
			var p = app.wrapValue(0, 4, g.dealer + thisRound.seatCount);
			var thisPlayer = g.players[p];
			
			//if player hasn't passed, make a bid
			if(thisPlayer.bidSuit != "pass" && thisRound.topBidPlayer != p){
			
				app.log("\r\nGetting bid for player " + thisPlayer.id + "...");
				
				//make the bid
				if(thisPlayer.ai != "Human"){
					thisRound.playerBids[p] = thisPlayer.getBid(thisRound.topBidAmount, thisRound.topBidSuit);
					
					app.log("Player " + thisPlayer.id + ": " + thisRound.playerBids[p]);
					
					thisRound.updateBiddingResults(g, p);
				}
				else{
					//let the player make a bid
					
					//update available bid options: player can only make a bid higher than current top bid, or must pass.
					//TODO: don't use a select box. it's too form-ish. just alter styling and responsiveness of invalid options.
					
					$('#select-playerBid').html('');
					
					var opts = [];
						
						opts.push("-Select Bid-");
						opts.push("Pass");
						
						for(var o in app.baseSchedule){
							var splitBid = app.baseSchedule[o].split(" ");
							if(thisRound.getBidPoints(splitBid[1], splitBid[0]) > thisRound.getBidPoints(thisRound.topBidSuit, thisRound.topBidAmount)){
								opts.push(app.baseSchedule[o]);
							}
						}
					
					for(var o in opts){
						$('#select-playerBid').append('<option value="'+opts[o]+'">'+opts[o]+'</option>');
					}
					
					//reveal bid schedule
					var bs = $('#panel-bidSchedule');
					bs.fadeIn("slow");
					
					/*bs.animate({
						'left':'0px'
					}, 800, function(){
						//on revealed callback
						//nothing to see here
					});*/
					
					//bind player bid select callback handler
					$('#submit-playerBid').on('click', function(){ 

						//evaluate bid
						var playerBid = $(this).val();						
						var splitBid = playerBid.split(" ");
						
						thisPlayer.bidAmount = splitBid[0];
						thisPlayer.bidSuit = splitBid[1];
						
						thisRound.playerBids[p] = playerBid;
						
						//hide bid schedule
						var bs = $('#panel-bidSchedule');
						bs.fadeOut("slow", function(){
							thisRound.updateBiddingResults(g, p);
						});
						
						/*bs.animate({
							'left':'205px'
						}, 800, function(){
							//wait until panel is fully hidden to continue
							thisRound.updateBiddingResults(g, p);						
						});	*/

					});
					
				}	
			}
			else{
				thisRound.updateBiddingResults(g, p);
			}
			
		}
		


		this.updateBiddingResults = function(g, p){
			
			app.log("\r\nChecking bid results...");
			
			var thisPlayer = g.players[p];
			
			//check bid result
			if(thisPlayer.bidSuit == "pass"){
				app.log("Player " + p + " passed");
			}
			else{
				//new high bid
				app.log("Player "+ p + " now holds the bid");
				
				thisRound.topBidSuit = thisPlayer.bidSuit;
				thisRound.topBidAmount = thisPlayer.bidAmount;
				thisRound.topBidPlayer = p;
			}
			
			//check for winning bid || all passed

			thisRound.passCount = 0;
			thisRound.bidCount = 0;
			for(var t = 0; t < g.players.length; t++){
				if(g.players[t].bidSuit == "pass"){
					thisRound.passCount++;
				}
				if(g.players[t].bidSuit != ""){
					thisRound.bidCount++;
				}
			}
			app.log("Pass count = " + thisRound.passCount + ", Bid count = " + thisRound.bidCount);
			
			if(thisRound.passCount > 4){
				app.log("\r\nAll players passed -> redeal");
				
				thisRound.trumpSuit = "redeal";
			}
			else if(thisRound.passCount == 4 && thisRound.bidCount == 5){
				//we have a winning bid
				
				app.log("\r\nPlayer " + thisRound.topBidPlayer + " has won the bid.\r\nContract is " + thisRound.topBidAmount + " " + thisRound.topBidSuit);

				thisRound.trumpSuit = thisRound.topBidSuit;
				thisRound.chief = thisRound.topBidPlayer;
				
				if(thisRound.topBidAmount < 8){
					thisRound.viceLimit = 1;
				}
				else{
					thisRound.viceLimit = 2;
				}
			}

			//check if bidding is finished
			if(thisRound.trumpSuit != ""){
				if(thisRound.trumpSuit != "redeal"){
					
					//convert jacks/joker to bowers/trump suit
					app.log("\r\nConverting bowers/joker to trump suit....");
					
					//check in player hands
					for(var pl = 0; pl < g.players.length; pl++){
						thisPlayer = g.players[pl];
						for(var c = 0; c < thisPlayer.hand.length; c++){
							thisRound.setBowers(thisPlayer.hand[c]);
						}
					}
					
					//check in kitty
					for(var c = 50; c < 53; c++){
						thisRound.setBowers(g.deck[c]);
					}
					
					//resort the hands
					app.log("\r\nResorting all hands...");
					for(var p = 0; p < g.players.length; p++){
						var thisPlayer = g.players[p];
						thisPlayer.sortHand("weight");
					}					
					
					//reset seat count to use for play phase
					thisRound.seatCount = 0;
					
					//advance to team selection
					//thisRound.runKittyPhase(g);
					
				}
				else{
					//everyone passed, start a new round
					g.thisRound = new app.GameRound(g);
				}			
			}
			else{
				//continue biding
				app.log("Continuing the bid...");
				thisRound.seatCount++;
				thisRound.runBidPhase(g);
			}
		
		}


		
		this.runKittyPhase = function(g){
		
			app.phase = "kitty";
			
			//Allow Chief to trade hand cards for kitty cards.
			
			app.log("\r\nPlayer " + thisRound.chief + " is petting the kitty...");
			
			var t = "";
			for(var i = 50; i < 53; i++){
				t += g.deck[i].toString() + ", ";
			}
			app.log(t);
			
			var thisPlayer = g.players[thisRound.chief];
			
			//AI logic
			
			if(thisPlayer.ai != "Human"){
				
				for(var i = 50; i < 53; i++){			
				
					//make a sub-copy that we can alter without affecting the original 
					var newCount = Object.create(thisPlayer.suitWeight);
					
					//sort cards to prioritize keeps and drops:
					//check for low count suits to trade off, ignore aces in counts because we want to keep them in hand.
					//we may also want to keep kings if they are paired consecutively with their ace.
					
					for(var c in thisPlayer.hand){
						var thisCard = thisPlayer.hand[c];
						if(thisCard.value == 14 && thisCard.suit != thisRound.trumpSuit){
							newCount[thisCard.suit] = newCount[thisCard.suit] - 1.0;
						}
					}
					
					//convert suit count object to sortable array & resort suits by new counts
					var sortedCount = [];
					for(var s in newCount){ sortedCount.push([s, newCount[s]]); }				
					sortedCount.sort(function(a, b){ return a[1] - b[1]; });
				
					//pet the kitty 
					var madeTrade = false;
					var thisKittyCard = g.deck[i];
					
					//take trumps, aces in kitty for offsuit in hand with least counts. take king if more than 0.5 count (any 1 card) of king's suit.
					// !!! should also take king if we have it's ace.
					// !!! probably should split the suit count into both 'count' and 'weight' properties, as the weight is good for bidding, but a raw qty count would be best here.
					if(thisKittyCard.suit == thisRound.trumpSuit || thisKittyCard.value == 14 || (thisKittyCard.value == 13 && sortedCount[app.getSortKeyIndex(sortedCount, thisKittyCard.suit)][1] > 0.5)){
					
						//we want this card, pick a hand card to trade.						
						for(var s = 0; s < 3 ; s++){
							
							for(var hc in thisPlayer.hand){
								var handCard = thisPlayer.hand[hc];

								if(!madeTrade){
									if(handCard.suit == sortedCount[s][0] && handCard.suit != thisRound.trumpSuit && handCard.value != 14){
										//use this card, make the trade
										
										app.log("\r\nTrading " + handCard.toString() + " for " + thisKittyCard.toString() + "\r\nResorting hand...");
										
										var tSuit = thisKittyCard.suit;
										var tValue = thisKittyCard.value;
										
										thisKittyCard.suit = handCard.suit;
										thisKittyCard.value = handCard.value;
										
										handCard.suit = tSuit;
										handCard.value = tValue;
										
										//resort hand
										thisPlayer.sortHand("weight");
										
										madeTrade = true;
									}
								}
								
							}
							
						}
					
					}
					else{
						
						//trade offsuit with count <= 1.0 for offsuit with higher count.
						for(var s = 0; s < 3; s++){
							if(sortedCount[s][1] <= 1.0 && sortedCount[s][0] != thisKittyCard.suit && sortedCount[app.getSortKeyIndex(sortedCount, thisKittyCard.suit)][1] > 0.5){
								
								//we want this card, pick a hand card to trade
								for(var hc in thisPlayer.hand){
									var handCard = hc;
									
									if(!madeTrade){
										if(handCard.suit == sortedCount[s][0] && handCard.suit != trumpSuit && handCard.value != 14 && sortedCount[app.getSortKeyIndex(sortedCount, handCard.suit)][1] > 0.5){
											//use this card, make the trade
											
											app.log("Trading " + handCard.toString() + " for " + thisKittyCard.toString() + "\r\nResorting hand...");
											
											var tSuit = thisKittyCard.suit;
											var tValue = thisKittyCard.value;
											
											thisKittyCard.suit = handCard.suit;
											thisKittyCard.value = handCard.value;
											
											handCard.suit = tSuit;
											handCard.value = tValue;
											
											//resort hand
											thisPlayer.sortHand("weight");
											
											madeTrade = true;										
										}
									}
									
								}
								
							}
						}
						
					}
					
				}
				
				//all 3 kitty cards have been evaluated and desired trades are made, proceed to Team Phase
				
				app.log("\r\nChief is choosing teammates...");
				
				thisRound.runTeamPhase(g);
			
			}
			else{
			
				//Human player, allow player to choose cards to swap and bind submit callback
				// execute the card swaps in the general card onclick handler based on phase state.
				
				$('#btn-kitty-submit').on('click', function(){
				
					thisRound.runTeamPhase(g);
					
				});
				
			}
			
		}



		this.runTeamPhase = function(g){
			
			app.phase = "team";
			
			//Allow Chief to choose teammates.
			
			var thisPlayer = g.players[thisRound.chief];
			
			//AI logic
			
			switch(thisPlayer.ai){
			
				case "Easy":
				
					//pick Vice 1 randomly
					thisRound.vice1 = thisRound.chief;
					while(thisRound.vice1 == thisRound.chief){
						thisRound.vice1 = app.getRnd(0, 4);
					}
					app.log("Player " + thisRound.vice1 + " chosen as Vice");
					
					//Vice 2
					if(thisRound.viceLimit == 2){
						
						//pick randomly
						thisRound.vice2 = thisRound.chief;
						while(thisRound.vice2 == thisRound.chief || thisRound.vice2 == thisRound.vice1){
							thisRound.vice2 = app.getRnd(0, 4);
						}				
						app.log("Player " + thisRound.vice2 + " chosen as Vice");
					
					}
				
					//start a new trick
					app.log("\r\nStarting Trick " + (thisRound.trickCount + 1));
					
					var thisTrick = new app.Trick();
					thisRound.trickCount++;
					
					//each round consists of 10 tricks, play starts with winner of previous trick, or left of dealer on trick 1
					
					thisTrick.leadPlayer = thisRound.nextLeadPlayer;
					
					app.log("Player " + thisTrick.leadPlayer + " leads the trick");					
					
					thisRound.seatCount = 0;
					
					thisRound.runPlayPhase(g, thisTrick);
					
					break;
					
				case "Hard":
				
                    //pick Vice 1 by criteria: bids made, play order, points etc
                    
						// !!! stub !!!
					
					//Vice 2
					if(thisRound.viceLimit == 2){

						// !!! stub !!!
					
					}					
				
					//start a new trick
					app.log("\r\nStarting Trick " + (thisRound.trickCount + 1));
					
					var thisTrick = new app.Trick();
					thisRound.trickCount++;
					
					thisTrick.leadPlayer = thisRound.nextLeadPlayer;
					
					app.log("Player " + thisTrick.leadPlayer + " leads the trick");					
					
					thisRound.seatCount = 0;
					
					thisRound.runPlayPhase(g, thisTrick);
				
					break;
			
				case "Human":
					/*
					//Human player, allow player to choose teammates up to allowed max and bind callbacks
					
					//Player Click
					$(function(){
						$(".player").click(function(e) {
							
							$(".player").removeClass("team-select");
							$(this).addClass("team-select");
							
						});
					});	
					
					//Confirm
					$('#btn-team-submit').on('click', function(){
					
						//lock in selection !!! add handling for no selection.
						
						var p = $(".team-select:first").attr("id");
							p = p.substr(p.length - 1);					
						
						if(thisRound.viceLimit == 1 || thisRound.vice1 == -1){

							//set vice1
							thisRound.vice1 = parseInt(p);
							
						}
						else if(thisRound.viceLimit == 2){
							
							//set vice2
							thisRound.vice2 = parseInt(p);
							
						}
						
						$(".player").removeClass("team-select");
						
						//check for all allowed selections made.
						if((thisRound.viceLimit == 1 && thisRound.vice1 > -1) || (thisRound.viceLimit == 2 && thisRound.vice2 > -1)){
							thisRound.runPlayPhase(g);
						}
						
					});
					
					//Choose No Team / Go it alone
					$('#btn-team-skip').on('click', function(){
						thisRound.viceLimit = 0;
						thisRound.runPlayPhase(g);
					});
					*/
					break;
				
			}
			
		}


		
		this.runPlayPhase = function(g, thisTrick){
			
			app.phase = "play";
			
			//each player must play a card to the trick
			var p = app.wrapValue(0, 4, thisTrick.leadPlayer + thisRound.seatCount);
			var thisPlayer = g.players[p];
						
			if(thisPlayer.ai != "Human"){
				
				thisPlayer.playCard(g, thisRound, thisTrick);
				
				thisRound.updatePlayPhase(g, thisTrick);
				
			}
			else{
			
				//let the player choose a card
				
				// !!! stub !!!
				
			}	
			
		}



		this.updatePlayPhase = function(g, t){
			
			app.log("update play: trick "+thisRound.trickCount + " seat: " + thisRound.seatCount);
			
			//check if trick is complete
			if(thisRound.seatCount >= 4){
			
				//check if round is complete
				if(thisRound.trickCount < 10){
					
					//trick is complete but round not finished
					app.log("trick is complete, but round continues");
					app.log("player " + t.topPlayer + " took the trick");
					
					//process trick results
					g.players[t.topPlayer].tricks++;
					thisRound.nextLeadPlayer = t.topPlayer;
					
					//start a new trick
					app.log("\r\nStarting Trick " + (thisRound.trickCount + 1));
					
					t = new app.Trick();
					thisRound.trickCount++;
					
					t.leadPlayer = thisRound.nextLeadPlayer;
					
					app.log("Player " + t.leadPlayer + " leads the trick");					
					
					thisRound.seatCount = 0;
					thisRound.runPlayPhase(g, t);
				
				}
				else{
					
					//round is complete, update score and check for winner
					
					var winners = [];
					
					//did chief meet the contract?
					var teamTricks = g.players[thisRound.chief].tricks;
					if(thisRound.vice1 > -1){ teamTricks += g.players[thisRound.vice1].tricks; }
					if(thisRound.vice2 > -1){ teamTricks += g.players[thisRound.vice2].tricks; }
					app.log("\r\nChief's team took " + teamTricks + " tricks");
					
					//get team point change
					var pointChange = thisRound.getBidPoints(thisRound.topBidSuit, thisRound.topBidAmount);
					if(teamTricks < thisRound.topBidAmount){
						pointChange = pointChange * -1; //chief was set
					}
					
					//update score, all on team will +/- by contract, individuals will +10 per trick taken
					for(var p = 0; p < 5; p++){
						
						if(p == thisRound.chief || p == thisRound.vice1 || p == thisRound.vice2){
							g.players[p].score += pointChange;
						}
						else{
							g.players[p].score += g.players[p].tricks * 10;
						}
						
						//check for win
						if(g.players[p].score >= 500){
							winners.push("Player "+p);
						}
						
						app.log("Player " + p + " score: " + g.players[p].score);
						
					}
					
					//Does the game continue?
					if(winners.length){
						
						//we have a winner, game is over
						
						app.log("\r\nGame is complete in " + g.roundCount + " rounds.\r\n");
						//break;
						
						//display winners and offer to start a new game
						
						// !!! stub !!!
						
					}
					else{
						//start another round
						app.log("\r\nNo winner, start a new round\r\n");
						g.thisRound = new app.GameRound(g);
					}
					
				}
				
			}
			else{
				//advance the seat and continue the trick
				thisRound.seatCount++;
				app.log("trick continues with seat " + thisRound.seatCount);
				thisRound.runPlayPhase(g, t);
			}
					
		}


		
		this.getBidPoints = function(suit, amount){
			var points = (100 * amount) - 580;
			
			switch(suit){
				case "Spades": points += 20; break;
				case "Clubs": points += 40; break;
				case "Diamonds": points += 60; break;
				case "Hearts": points += 80; break;
				case "No-Trump": points += 100; break;
			}
			
			return points;
		}
		
		
		
		this.setBowers = function(c){
			
			//if trump suit is no trump, change nothing.
			
			if(thisRound.trumpSuit != "No-Trump"){
				
				//Set Joker to trump suit
				
				if(c.toString() == "JK"){
					c.suit = thisRound.trumpSuit;
				}
				
				thisRound.topInSuit[thisRound.trumpSuit] = "JK";
				
				//Set Bowers
				
				switch (thisRound.trumpSuit) {
					
					case "Spades":
						if(c.toString() == "JS"){
							c.value = 16;
							c.suit = thisRound.trumpSuit;
						}
						if(c.toString() == "JC"){
							c.value = 15;
							c.suit = thisRound.trumpSuit;
						}
						break;
						
					case "Clubs":
						if(c.toString() == "JC"){
							c.value = 16;
							c.suit = thisRound.trumpSuit;
						}
						if(c.toString() == "JS"){
							c.value = 15;
							c.suit = thisRound.trumpSuit;
						}
						break;	

					case "Diamonds":
						if(c.toString() == "JD"){
							c.value = 16;
							c.suit = thisRound.trumpSuit;
						}
						if(c.toString() == "JH"){
							c.value = 15;
							c.suit = thisRound.trumpSuit;
						}
						break;	

					case "Hearts":
						if(c.toString() == "JH"){
							c.value = 16;
							c.suit = thisRound.trumpSuit;
						}
						if(c.toString() == "JD"){
							c.value = 15;
							c.suit = thisRound.trumpSuit;
						}
						break;						
				}
				
			}
		}



		this.foeCanTrump = function(suit, myID, myTeam1, myTeam2){
			
			// !!! this needs to add a check to see if the opponent has played to the current trick yet. It doesn't matter if they are out of lead suit if they have already dropped a card.
			
			var foeOut = false;
			
			for(var p in g.players){
				if(thisRound.outOfSuit[suit][p.id] && !thisRound.outOfSuit[thisRound.trumpSuit][p.id]){
					if(p.id != myTeam1 && p.id != myTeam2 && p.id != myID){
						foeOut = true;
					}
				}
			}
			
			return foeOut;
		}


		
		//Execute on Construct - - - - - - - - - - - - - 
		
		//reset player round data
		for(var p = 0; p < 5; p++){
			g.players[p].bidSuit = "";
			g.players[p].bidAmount = 0;
			g.players[p].tricks = 0;
			g.players[p].hand = [];
		}

		//update total round count
		g.roundCount++;
		
		//update dealer
		g.dealer = app.wrapValue(0, 4, g.dealer + 1);
		
		//play starts left of dealer
		thisRound.nextLeadPlayer = app.wrapValue(0, 4, g.dealer + 1);
		
		//shuffle the deck
		g.shuffle();
		
		//deal the hands
		g.deal();
		
		//get the bids
		app.log("\r\nStarting the Bid...");
		
		thisRound.runBidPhase(g);
		
	}
		
		
		
	//Trick Class ------------------------------------------------------------
	
	this.Trick = function(){
		
		//Trick Init - - - - - - - - - - - - - 
		
		var thisTrick = this;
		
		this.leadPlayer = -1;
		this.leadSuit = "";
		this.topSuit = "";
		this.topValue = 0;
		this.topPlayer = -1;
		
		this.playedThisTrick = [];
		for(var i = 0; i < 5; i++){ this.playedThisTrick[i] = ""; }
		
		
		
		//Define Trick Methods - - - - - - - - - - - - - 
		
		this.trumpInPlay = function(trumpSuit){
			
			for(var c = 0; c < 5; c++){
				if(c != ""){
					var thisSuit = thisTrick.playedThisTrick[c].substr(1,1);
					if(thisSuit == "B" || thisSuit == "K" || thisSuit == trumpSuit.substr(0,1)){
						return true;
					}
				}
			}
			return false;
			
		}
		
		
		
		this.topInPlay = function(topCard){
		
			for(var c = 0; c < 5; c++){
				var thisCard = thisTrick.playedThisTrick[c];
				if(thisCard == topCard){
					return true;
				}
			}
			return false;
			
		}
		


		//Execute on Construct - - - - - - - - - - - - - 
		
		
	}
	


	
	//Card Class ------------------------------------------------------------
	
	this.Card = function(s, v){
		
		//Card Init - - - - - - - - - - - - - 
		
		var thisCard = this;
		
		this.suit = s;
		this.value = v;
		
		this.eid = "#card-" + s.substr(0,1) + v;
		
		
		
		//Define Card Methods - - - - - - - - - - - - - 
		
		this.toString = function(){
		
			switch(thisCard.value){
				case 2: return "2" + thisCard.suit.substr(0, 1);
				case 3: return "3" + thisCard.suit.substr(0, 1);
				case 4: return "4" + thisCard.suit.substr(0, 1);
				case 5: return "5" + thisCard.suit.substr(0, 1);
				case 6: return "6" + thisCard.suit.substr(0, 1);
				case 7: return "7" + thisCard.suit.substr(0, 1);
				case 8: return "8" + thisCard.suit.substr(0, 1);
				case 9: return "9" + thisCard.suit.substr(0, 1);
				case 10: return "10" + thisCard.suit.substr(0, 1);
				case 11: return "J" + thisCard.suit.substr(0, 1);
				case 12: return "Q" + thisCard.suit.substr(0, 1);
				case 13: return "K" + thisCard.suit.substr(0, 1);
				case 14: return "A" + thisCard.suit.substr(0, 1);
				case 15: return "LB";
				case 16: return "RB";
				case 17: return "JK";
				default: return "err!";
			}
			
		}
		
		
		
		this.toStringFull = function(){
		
			switch(thisCard.value){
				case 2: return "Two of " + thisCard.suit;
				case 3: return "Three of " + thisCard.suit;
				case 4: return "Four of " + thisCard.suit;
				case 5: return "Five of " + thisCard.suit;
				case 6: return "Six of " + thisCard.suit;
				case 7: return "Seven of " + thisCard.suit;
				case 8: return "Eight of " + thisCard.suit;
				case 9: return "Nine of " + thisCard.suit;
				case 10: return "Ten of " + thisCard.suit;
				case 11: return "Jack of " + thisCard.suit;
				case 12: return "Queen of " + thisCard.suit;
				case 13: return "King of " + thisCard.suit;
				case 14: return "Ace of " + thisCard.suit;
				case 15: return "Left Bower";
				case 16: return "Right Bower";
				case 17: return "Joker";
				default: return "err!";
			}	
			
		}
		
		
		
		this.getNextCard = function(offset){
			
			var pickVal = thisCard.value + offset;
			if(pickVal < 2){ pickVal = 2; }
			if(pickVal > 17){ pickVal = 17; }
			
			switch(pickVal){
				case 2: return "2" + thisCard.suit.substr(0, 1);
				case 3: return "3" + thisCard.suit.substr(0, 1);
				case 4: return "4" + thisCard.suit.substr(0, 1);
				case 5: return "5" + thisCard.suit.substr(0, 1);
				case 6: return "6" + thisCard.suit.substr(0, 1);
				case 7: return "7" + thisCard.suit.substr(0, 1);
				case 8: return "8" + thisCard.suit.substr(0, 1);
				case 9: return "9" + thisCard.suit.substr(0, 1);
				case 10: return "10" + thisCard.suit.substr(0, 1);
				case 11: return "J" + thisCard.suit.substr(0, 1);
				case 12: return "Q" + thisCard.suit.substr(0, 1);
				case 13: return "K" + thisCard.suit.substr(0, 1);
				case 14: return "A" + thisCard.suit.substr(0, 1);
				case 15: return "LB";
				case 16: return "RB";
				case 17: return "JK";
				default: return "err!";
			}
			
		}


		//Execute on Construct - - - - - - - - - - - - - 
		
		
	}


	
	//Player Class ------------------------------------------------------------
	
	this.Player = function(aiMode){
		
		app.log("Making new player: " + aiMode);
		
		//Player Init - - - - - - - - - - - - - 
		
		var thisPlayer = this;
		
		this.id = -1;
		
		this.score = 0;
		this.tricks = 0;
		
		this.ai = aiMode;
		this.name = "";
		
		this.hand = [];
		
		this.bidSuit = "";
		this.bidAmount = 0;
		
		this.suitWeight = {"Spades": 0.0, "Clubs": 0.0, "Diamonds": 0.0, "Hearts": 0.0 };
		this.suitCount = {"Spades": 0, "Clubs": 0, "Diamonds": 0, "Hearts": 0 };
		
		
		
		//Define Player Methods - - - - - - - - - - - - - 

		this.sortHand = function(mode){
		
			var t = "\r\nPlayer " + thisPlayer.id + "\r\nHand: ";
			for(var c = 0; c < thisPlayer.hand.length; c++){
				t += thisPlayer.hand[c].toString() + ", ";
			}
			app.log(t);		
		
			thisPlayer.getSuitWeight();
			
			//sort by values, then by suits
			thisPlayer.hand.sort(function(a, b){ return a.value - b.value; });
			thisPlayer.hand.sort(function(a, b){ return app.suitVal[a.suit] - app.suitVal[b.suit]; });
			
			//if AI, then by count mode
			if(mode == "weight"){
				//weighted count of suit
				app.log("Eval: S: " + thisPlayer.suitWeight.Spades + ", C: " + thisPlayer.suitWeight.Clubs + ", D: " + thisPlayer.suitWeight.Diamonds + ", H: " + thisPlayer.suitWeight.Hearts);
				if(thisPlayer.ai != "Human"){
					thisPlayer.hand.sort(function(a, b){ return thisPlayer.suitWeight[a.suit] - thisPlayer.suitWeight[b.suit]; });
				}
			}
			else{
				//raw count
				app.log("Eval: S: " + thisPlayer.suitCount.Spades + ", C: " + thisPlayer.suitCount.Clubs + ", D: " + thisPlayer.suitCount.Diamonds + ", H: " + thisPlayer.suitCount.Hearts);
				if(thisPlayer.ai != "Human"){
					thisPlayer.hand.sort(function(a, b){ return thisPlayer.suitCount[a.suit] - thisPlayer.suitCount[b.suit]; });
				}
			}
			
			var t = "Sort: ";
			for(var c = 0; c < thisPlayer.hand.length; c++){
				t += thisPlayer.hand[c].toString() + ", ";
			}
			app.log(t);				
			
			//update display
			var playerElement = $('#player-' + thisPlayer.id);
			var playerOffset = playerElement.offset();
			
			for(var c = 0; c < thisPlayer.hand.length; c++){
				var thisCard = thisPlayer.hand[c];
			
				var cardElement = $(thisCard.eid);
				cardElement.css('z-index', 100 + c);
				
				if(thisPlayer.ai != "Human"){
					var posx = 8 + (15 * c);
					var posy = 68 + (1 * c);
					app.flipCard(thisCard.eid, "down"); 
				}
				else{
					var posx = 10 + ((cardElement.width() + 13) * c);
					var posy = 74;				
				}
				
				app.pasteCard(thisCard.eid, "#player-"+thisPlayer.id, posx, posy);
			}
			
		}
		
		
		
		this.getSuitWeight = function(){
			
			//This will evaluate the number of cards for each suit in the player's hand.
			//It is used by the AI to determine bidding.
			//It is a weighted count by card value such that a King counts higher in the decision making than a 2 for example.
			//The current cut point is 8, if this is lowered, the AI is more likely to make higher bids, but will be less likely to be able to meet the contract.
			
			//reset the count
			thisPlayer.suitWeight = {"Spades": 0.0, "Clubs": 0.0, "Diamonds": 0.0, "Hearts": 0.0 };
			thisPlayer.suitCount = {"Spades": 0, "Clubs": 0, "Diamonds": 0, "Hearts": 0 };
			
			for(var c in thisPlayer.hand){
				
				var thisCard = thisPlayer.hand[c];
				
				if(thisCard.suit != "Joker"){
					if(thisCard.value <= 8){
						thisPlayer.suitWeight[thisCard.suit] += 0.5;
					}
					else{
						thisPlayer.suitWeight[thisCard.suit] += 1.0;
					}
					
					thisPlayer.suitCount[thisCard.suit] += 1;
				}
				
			}
			
		}



		this.getBid = function(topBid, topSuit){
			
			//analyze hand 
			thisPlayer.getSuitWeight();
			
			var trumpWeight = {"Spades": thisPlayer.suitWeight.Spades, "Clubs": thisPlayer.suitWeight.Clubs, "Diamonds": thisPlayer.suitWeight.Diamonds, "Hearts": thisPlayer.suitWeight.Hearts };
			
			for(var c in thisPlayer.hand){
			
				var thisCard = thisPlayer.hand[c];
				
				switch(thisCard.suit){
					case "Spades":
						if(thisCard.value == 11){
							//Sister Suit Jack = potential Bower
							trumpWeight.Clubs += 1.0
						}
						if(thisCard.value == 14){
							//an Ace is ace! count offsuits, but weighted down
							trumpWeight.Clubs += 0.5;
							trumpWeight.Diamonds += 0.5;
							trumpWeight.Hearts += 0.5;
						}
						break;
						
					case "Clubs":
						if(thisCard.value == 11){
							trumpWeight.Spades += 1.0
						}
						if(thisCard.value == 14){
							trumpWeight.Spades += 0.5;
							trumpWeight.Diamonds += 0.5;
							trumpWeight.Hearts += 0.5;
						}
						break;

					case "Diamonds":
						if(thisCard.value == 11){
							trumpWeight.Hearts += 1.0
						}
						if(thisCard.value == 14){
							trumpWeight.Spades += 0.5;
							trumpWeight.Clubs += 0.5;
							trumpWeight.Hearts += 0.5;
						}
						break;

					case "Hearts":
						if(thisCard.value == 11){
							trumpWeight.Diamonds += 1.0
						}
						if(thisCard.value == 14){
							trumpWeight.Spades += 0.5;
							trumpWeight.Clubs += 0.5;
							trumpWeight.Diamonds += 0.5;
						}
						break;

					case "Joker":
						//obviously this will be a trump for any suit
						trumpWeight.Spades += 1.0;
						trumpWeight.Clubs += 1.0;
						trumpWeight.Diamonds += 1.0;						
						trumpWeight.Hearts += 1.0;							
						break;						
				}
			
			}
				
			//get max suit
			var bidCount = 10;
			var maxSuit = "";
			
			while(maxSuit == ""){
				
				if(trumpWeight.Hearts >= bidCount){
					maxSuit = "Hearts";
				}
				else if(trumpWeight.Diamonds >= bidCount){
					maxSuit = "Diamonds";
				}
				else if(trumpWeight.Clubs >= bidCount){
					maxSuit = "Clubs";
				}
				else if(trumpWeight.Spades >= bidCount){
					maxSuit = "Spades";
				}
				else{
					bidCount--;
				}
				
			}
			
			//get max bid
			
			//-1 indicates a pass.
			//6 is the minimum allowable bid.
			//10 is technically the maximum allowable bid, but is capped here at 8 to help the AI avoid getting set too often.
			//any bid higher than 7 will allow the chief to select 2 partners for the team.
			//this will determine how aggresively the AI will bid.
			//if it is altered so that higher bids are made at lower counts, the AI is more likely to win the bid, but is less likely to meet the contract.
			//this could be set up to support multiple variants which could be selectable by AI mode to give a greater difference in decision making between AI players.
			
			var maxBid = 0;
			
			switch(bidCount){
				
				case 1: maxBid = -1; break;
				case 2: maxBid = -1; break;
				case 3: maxBid = -1; break;
				case 4: maxBid = 6; break;
				case 5: maxBid = 6; break;
				case 6: maxBid = 6; break;
				case 7: maxBid = 7; break;
				case 8: maxBid = 7; break;
				case 9: maxBid = 8; break;
				case 10: maxBid = 8; break;
				default: maxBid = -1; break;
			}
			
			//get bid or pass
			
			thisPlayer.bidAmount = 0;
			thisPlayer.bidSuit = "pass";
			
			if(maxBid > -1){
				
				//if no other bids are in play, make a minimum bid of 6
				if(topBid < 6){
					thisPlayer.bidAmount = 6;
					thisPlayer.bidSuit = maxSuit;
				}
				else{
					
					//there is an existing bid, check if our max bid count can match or beat it. If we can't beat the bid, we will default back to "pass"
					if(topBid <= maxBid){
					
						//check if we can beat it by suit, ie 6 Hearts > 6 Clubs
						if(app.suitVal[maxSuit] > app.suitVal[topSuit]){
							//match the bid in the higher suit
							thisPlayer.bidAmount = topBid;
							thisPlayer.bidSuit = maxSuit;
						}
						else{
							//can't beat the bid by suit, check if we can go up in bid amount
							if((topBid + 1) <= maxBid){
								thisPlayer.bidAmount = topBid + 1;
								thisPlayer.bidSuit = maxSuit;
							}
						}
						
					}
					
				}
				
			}
			
			return thisPlayer.bidAmount + " " + thisPlayer.bidSuit;
		}



		this.playCard = function(g, thisRound, thisTrick){
			
			app.log("\r\nPlayer " + thisPlayer.id + " is thinking...");
			
			var playThis = "";
			var playStatus = "";
			var checkVal = 0;
			var checkSuit = "";
			
			var t = "";
			for(var p in thisTrick.playedThisTrick){
				t += thisTrick.playedThisTrick[p] + ",";
			}
			app.log("Cards now in play: " + t);			
			
			app.log("Top remaining in suits: " + thisRound.topInSuit["Spades"] + " " + thisRound.topInSuit["Clubs"] + " " + thisRound.topInSuit["Diamonds"] + " " + thisRound.topInSuit["Hearts"]);
			
			var t = "";
			for(var c = 0; c < thisPlayer.hand.length; c++){
				t += thisPlayer.hand[c].toString() + ",";
			}
			app.log("My hand: " + t);
			
			//do I have partners?
			var myTeam1 = -1;
			var myTeam2 = -1;
			
			if(thisPlayer.id == thisRound.chief){
				myTeam1 = thisRound.vice1;
				if(thisRound.vice2 > -1){ myTeam2 = thisRound.vice2; }
			}
			else if(thisPlayer.id == thisRound.vice1){
				myTeam1 = thisRound.chief;
				if(thisRound.vice2 > -1){ myTeam2 = thisRound.vice2; }				
			}
			else if(thisPlayer.id == thisRound.vice2){
				myTeam1 = thisRound.chief;
				myTeam2 = thisRound.vice2;
			}
			
			//choose a card to play
			
			//do I start the trick?
			
			if(thisTrick.leadSuit == ""){
				
				//yes, I start. Do I have the top card in a nontrump suit?
				app.log("I start the trick");
				
				for(var s in thisRound.topInSuit){
					if(s != thisRound.trumpSuit && playThis == ""){
						if(thisPlayer.cardInHand(thisRound.topInSuit[s])){
							
							//I have the highest in a nontrump suit. Is anyone known to be out of this suit?
							app.log("I have the highest " + s);
							
							//If no opponents are out, play the top card in this suit
							if(thisRound.foeCanTrump(s, thisPlayer.id, myTeam1, myTeam2) == false){
								app.log("No opponents are known to be out of " + s);
								
								playThis = thisRound.topInSuit[s];
							}
							else{
								//An opponent is out of this suit. The other non trump suits will be checked, just pass through.
								app.log("An opponent is known to be out of " + s);
							}
						}
					}
				}
				
				//All nontrump suits have been checked. If I haven't picked a card, continue thinking.
				if(playThis == ""){
					app.log("I don't have the highest in any nontrump suit.");
					
					//Do I have the highest in trump?
					if(thisPlayer.cardInHand(thisRound.topInSuit[thisRound.trumpSuit])){
						
						//I have the highest trump, play it
						app.log("I have highest trump");
						
						playThis = thisRound.topInSuit[thisRound.trumpSuit];
					}
					else{
					
						//I don't have the highest trump, do I have any trumps?
						app.log("I don't have the highest trump");
						
						if(thisPlayer.suitInHand(thisRound.trumpSuit)){
							
							//I have a trump. Play the lowest value card of the nontrump suit with least count. (we want to open up trump usage.)
							app.log("I have a trump, play lowest in least");
							
							playThis = thisPlayer.getCard("lowest", "least", thisRound.trumpSuit);
						}
						else{
						
							//I don't have any trumps. Play the lowest value card of suit with most count. (if we run out of a suit, we cant take tricks in that suit. keep as many suits viable with high value cards as possible.)
							app.log("I don't have a trump, play lowest in most");
							
							playThis = thisPlayer.getCard("lowest", "most", thisRound.trumpSuit);							
						}
						
					}
					
				}
				
			}
			else{
				
				//Someone else lead. Do I have any of the leading suit?
				app.log("Trick is in progress");
				
				if(thisPlayer.suitInHand(thisTrick.leadSuit)){
					
					//I have the lead suit, do I have partners?
					if(myTeam1 > -1){
						
						//I have at least 1 partner, do I play last in the trick?
						if(thisPlayer.id == app.wrapValue(0, 4, thisTrick.leadPlayer - 1)){
							
							//I play last, is a partner currently winning the trick?
							if(thisTrick.topPlayer == myTeam1 || thisTrick.topPlayer == myTeam2){
								
								//A partner currently holds the trick, play lowest of lead suit. (throw under to let partner take the trick and I save high value cards for later. I am last so there is no risk)
								app.log("Partner has the trick, throw under");
								playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
								
							}
							else{
							
								//an opponent currently holds the trick. has a trump been thrown?
								app.log("Opponent has the trick");
								if(thisTrick.trumpInPlay(thisRound.trumpSuit)){
									
									//trump was thrown, play lowest of leading suit (we can't take this one, throw out some trash)
									app.log("Trump was thrown, I have to throw under");
									playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
								
								}
								else{
									
									//no trumps have thrown, do I have a value in the lead suit higher than the current top value?
									var canTakeIt = false;
									for(var c in thisPlayer.hand){
										if(playThis == ""){
											var thisCard = thisPlayer.hand[c];
											if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
												//I can take the trick, play this card.
												app.log("I can take the trick");
												canTakeIt = true;
												playThis = thisCard.toString();
											}
										}
									}
									
									if(!canTakeIt){
										//I can't take the trick. play lowest value card of lead suit.
										app.log("I can't take the trick, throw under");
										playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
									
								}
								
							}
							
						}
						else{
						
							//I'm not last. Have any of my partners played yet?
							app.log("Others will play after me");
							
							var teamPlayed = 0;
							
							if(thisTrick.playedThisTrick[myTeam1] != ""){
								app.log("Teammate 1 has played");
								teamPlayed++;
							}
							
							if(myTeam2 > -1){
								if(thisTrick.playedThisTrick[myTeam2] != ""){
									app.log("Teammate 2 has played");
									teamPlayed++;
								}
							}
							
							if(teamPlayed > 0){
							
								//At least one partner has played. Do they currently hold the trick?
								if(thisTrick.topPlayer == myTeam1 || thisTrick.topPlayer == myTeam2){
									
									//A partner holds the trick
									app.log("A partner holds the trick");
									
									if(thisPlayer.ai == "Easy"){
										//Simple logic: play lowest of lead suit (let partner hold the trick and save higher cards for later)
										app.log("throw under partner");
										playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
									else if(thisPlayer.ai == "Hard"){
										//Complex logic: is anyone after me known to be out of the lead suit?
										if(thisRound.foeCanTrump(thisTrick.leadSuit, thisPlayer.id, myTeam1, myTeam2)){
											//An opponent is out of lead suit, may be able to throw trump. play lowest of lead suit
											app.log("Opponent might throw a trump, throw under");
											playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
										}
										else{
											
											//no opponents are out of lead suit. has anyone played the top remaining card in the lead suit?
											// *** note: topInSuit must be updated at the end of the trick to account for ie player 1 played AS then player 2 plays KS, AS must remain as topInSuit until the trick is finished.
											// *** so, if someone has played topInSuit it will match their playedToTrick
											var topInPlay = false;
											for(var p = 0; p < 5; p++){
												if(thisTrick.playedThisTrick[p] == thisRound.topInSuit[thisTrick.leadSuit]){
													topInPlay = true;
												}
											}
											
											if(topInPlay){
												//Someone played the top card in lead suit. I have to throw under.
												app.log("Someone played top in lead suit, throw under");
												playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);											
											}
											else{
												
												//Top in lead suit has not been played, do I have it?
												app.log("Top card in lead suit has not yet been played");
												var haveTop = false;
												for(var c in thisPlayer.hand){
													var thisCard = thisPlayer.hand[c];
													if(thisCard.toString() == thisRound.topInSuit[thisTrick.leadSuit]){
														haveTop = true;
													}			
												}
													
												if(haveTop){
												
													//I have the top card in the lead suit. Has a partner played the next highest down?
													app.log("I have the top card in the lead suit");
													// !!! ???
													var i = thisTrick.playedThisTrick.indexOf(thisCard.getNextCard(-1));
													if(i > -1 && i == myTeam1 || i > -1 && i == myTeam2 ){
														//A partner played next card down, they have the trick, throw under and save top card for later.
														app.log("Partner has the next highest down, throw under");
														playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
													}
													else{
														//partner could be beat, throw top card in suit
														app.log("Partner could be beat, play top in lead suit");
														playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
													}
													
												}
												else{
													
													//I don't have the top card in lead suit, and highest has not yet been played. play lowest card of lead suit.
													//top card will probably come out later in the trick and beat anything we throw, save higher cards for later.
													app.log("I don't have top in lead suit, throw under");
													playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
												}
												
											}
											
										}
										
									}
									
								}
								else{
								
									//An opponent holds the trick
									app.log("An opponent holds the trick");
									
									if(thisPlayer.ai == "Easy"){
									
										//simple logic: Do I have a card higher than the current top card?
										var canTake = false;
										
										for(var c in thisPlayer.hand){
											if(playThis == ""){
												var thisCard = thisPlayer.hand[c];
												if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
													//I can hold the trick, may take it. play highest card of lead suit
													app.log("I may be able to take the trick, pick highest of lead suit");
													canTake = true;
													playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
												}
											}
										}
										
										if(!canTake){
											//can't take the trick, throw under
											app.log("I can't take the trick, must throw under: pick lowest of lead suit");
											playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
										}
									
									}
									else{
									
										//complex logic: Do I have the top card in the lead suit?
										
										if(thisPlayer.cardInHand(thisRound.topInSuit[thisTrick.leadSuit])){
										
											//I have the highest. Is anyone after me known to be out of this suit?
											app.log("I have top card in lead suit");
											
											if(thisRound.foeCanTrump(thisTrick.leadSuit, g.players, thisPlayer.id, myTeam1, myteam2)){
											
												//An opponent is out of lead suit, may be able to throw trump. play a card high enough to hold the trick, but save top in suit if possible.
												app.log("Opponent may throw trump. hold the trick but save top in suit if possible");
												
												for(var c in thisPlayer.hand){
													if(playThis == ""){
														var thisCard = thisPlayer.hand[c];
														if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
															playThis = thisCard.toString();
														}	
													}
												}
												
											}
											else{
												//No one is known to be out, throw highest of lead suit.
												app.log("No opponents are known to be out of lead suit. Throw top in suit");
												playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
											}
										
										}
										else{
											//I don't have the highest and may be beat. throw under.
											app.log("I don't have the highest of this suit. throw lowest of lead suit");
											playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
										}
										
									}
									
								}
								
							}
							else{
							
								//No one on my team has played yet.
								app.log("No one on my team has played yet");
								
								if(thisPlayer.ai == "Easy"){
									
									//simple logic: Do I have a card higher than the current top card?
									var canTake = false;
									
									for(var c in thisPlayer.hand){
										if(playThis == ""){
											var thisCard = thisPlayer.hand[c];
											if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
												//I can hold the trick, may take it. play highest card of lead suit
												app.log("I may be able to take the trick, pick highest of lead suit");
												canTake = true;
												playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
											}
										}
									}
									
									if(!canTake){
										//can't take the trick, throw under
										app.log("I can't take the trick, must throw under, pick lowest of lead suit");
										playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
									
								}
								else{
								
									//Complex logic: Has top in lead suit been played?
									if(thisTrick.topInPlay(thisRound.topInSuit[thisTrick.leadSuit])){
										//An opponent has played the top card in the lead suit. must throw under.
										app.log("An opponent has played the top card in the lead suit. must throw under, pick lowest in lead suit");
										playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
									else{
									
										//No one has played top in suit yet, do I have it?
										if(thisPlayer.cardInHand(thisRound.topInSuit[thisTrick.leadSuit])){
										
											//I have the highest. Is anyone after me known to be out of this suit?
											app.log("I have top card in lead suit");
											
											if(thisRound.foeCanTrump(thisTrick.leadSuit, g.players, thisPlayer.id, myTeam1, myteam2)){
											
												//An opponent is out of lead suit, may be able to throw trump. play a card high enough to hold the trick, but save top in suit if possible.
												app.log("Opponent may throw trump. hold the trick but save top in suit if possible");
												
												for(var c in thisPlayer.hand){
													if(playThis == ""){
														var thisCard = thisPlayer.hand[c];
														if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
															playThis = thisCard.toString();
														}	
													}
												}
												
											}
											else{
												//No one is known to be out, throw highest of lead suit.
												app.log("No opponents are known to be out of lead suit. Throw top in suit");
												playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
											}
										
										}
										else{
											//I don't have the highest and may be beat. throw under.
											app.log("I don't have the highest of this suit. throw lowest of lead suit");
											playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
										}	
										
									}
									
								}
								
							}
							
						}
						
					}
					else{
					
						//I have no partners
						app.log("I don't have partners");
						
						if(thisPlayer.ai == "Easy"){
						
							//simple logic: Do I have a card higher than the current top card?
							var canTake = false;
							
							for(var c in thisPlayer.hand){
								if(playThis == ""){
									var thisCard = thisPlayer.hand[c];
									if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
										//I can hold the trick, may take it. play highest card of lead suit
										app.log("I may be able to take the trick, pick highest of lead suit.");
										canTake = true;
										playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
								}
							}
							
							if(!canTake){
								//can't take the trick, throw under
								app.log("I can't take the trick, must throw under, pick lowest in lead suit");
								playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
							}
							
							
						}
						else{
						
							//Complex logic: Has top in lead suit been played?
							if(thisTrick.topInPlay(thisRound.topInSuit[thisTrick.leadSuit])){
								//An opponent has played the top card in the lead suit. must throw under.
								app.log("An opponent has played the top card in the lead suit. must throw under, pick lowest in lead suit");
								playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
							}
							else{
							
								//No one has played top in suit yet, do I have it?
								if(thisPlayer.cardInHand(thisRound.topInSuit[thisTrick.leadSuit])){
								
									//I have the highest. Is anyone after me known to be out of this suit?
									app.log("I have top card in lead suit");
									
									if(thisRound.foeCanTrump(thisTrick.leadSuit, g.players, thisPlayer.id, myTeam1, myteam2)){
									
										//An opponent is out of lead suit, may be able to throw trump. play a card high enough to hold the trick, but save top in suit if possible.
										app.log("Opponent may throw trump. hold the trick but save top in suit if possible");
										
										for(var c in thisPlayer.hand){
											if(playThis == ""){
												var thisCard = thisPlayer.hand[c];
												if(thisCard.suit == thisTrick.leadSuit && thisCard.value > thisTrick.topValue){
													playThis = thisCard.toString();
												}	
											}
										}
										
									}
									else{
										//No one is known to be out, throw highest of lead suit.
										app.log("No opponents are known to be out of lead suit. Throw top in suit");
										playThis = thisPlayer.getCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
									}
								
								}
								else{
									//I don't have the highest and may be beat. throw under.
									app.log("I don't have the highest of this suit. throw lowest of lead suit");
									playThis = thisPlayer.getCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
								}	
								
							}
									
						}
						
					}
					
				}
				else{
					
					//I am out of the lead suit, I can use trumps and offsuits. Do I have any trumps?
					app.log("I am out of the leading suit");
					
					if(thisPlayer.suitInHand(thisRound.trumpSuit)){
					
						//I have a trump, Do I have partners?
						app.log("I have trumps");
						
						// !!! stub !!!
						
						// !!! Temp: use simpler logic for now: is there a trump in play?
						if(thisTrick.trumpInPlay(thisRound.trumpSuit)){
						
							//yes there is a trump. Do I have a higher trump?
							var canTake = false;
							
							for(var c in thisPlayer.hand){
								if(playThis == ""){
									var thisCard = thisPlayer.hand[c];
									if(thisCard.suit == thisRound.trumpSuit && thisCard.value > thisTrick.topValue){
										//I can hold the trick, may take it. play highest card of trump suit
										app.log("I may be able to take the trick, pick highest trump");
										canTake = true;
										playThis = thisPlayer.getCard("highest", thisRound.trumpSuit, thisRound.trumpSuit);
									}
								}
							}
							
							if(!canTake){
								//can't take the trick, throw under with offsuit of least count. (work towards opening my trump usage across more suits.)
								app.log("I can't take the trick, throw lowest offsuit");
								playThis = thisPlayer.getCard("lowest", "least", thisRound.trumpSuit);
							}
							
						}
						else{
							
							//No trumps in play, I can hold the trick with any trump, throw lowest
							app.log("No trumps in play, hold trick with my lowest trump");
							playThis = thisPlayer.getCard("lowest", thisRound.trumpSuit, thisRound.trumpSuit);
						}
						
					}
					else{
						
						//I have no trumps, must throw an offsuit. pick lowest value card of suit with most count. (keep as many high cards in as many suits as possible)
						app.log("I can't take the trick and have no more trumps. throw lowest value of most count");
						playThis = thisPlayer.getCard("lowest", "most", thisRound.trumpSuit);
					}
					
				}
				
			}
			
			if(playThis == ""){
				app.log("\r\nerror: no card has been chosen, AI logic fault\r\n");
			}
			else{
			
				//card is chosen, handle updates
				app.log("Player chose to play " + playThis);
				
				//evaluate card
				for(var c = 0; c < thisPlayer.hand.length; c++){
					
					var thisCard = thisPlayer.hand[c];
					
					if(thisCard.toString() == playThis){
						checkVal = thisCard.value;
						checkSuit = thisCard.suit;
					}
					
				}
				app.log("Played value " + checkVal + " of suit " + checkSuit);
				
				playStatus = "throw under";
				
				//Did anyone throw a trump?
				if(thisTrick.trumpInPlay(thisRound.trumpSuit) == true){
				
					app.log("Trump is in play");
					
					//Did I throw a trump?
					if(checkSuit == thisRound.trumpSuit){
						
						app.log("I threw trump");
						
						//Do I have top in trump?
						if(checkVal >= thisTrick.topValue){
							app.log("My trump wins, I am new on top");
							playStatus = "new on top";
						}
						else{
							app.log("My trump was beaten");
							playStatus = "throw under";
						}
						
					}
					else{
						app.log("I was trumped");
						playStatus = "throw under";
					}
					
				}
				else{
					
					//no trumps thrown, did I start the trick?
					if(thisTrick.leadSuit == ""){
						app.log("I lead the trick, I am new on top");
						playStatus = "new on top";
					}
					else{
						
						//did not lead, did I play in lead suit?
						if(checkSuit == thisTrick.leadSuit){
							app.log("I played in the lead suit, no trumps in play");
							
							//Do I have top in lead suit?
							if(checkVal >= thisTrick.topValue){
								app.log("I have the highest in trick, I am new on top");
								playStatus = "new on top";
							}
							else{
								app.log("I was beaten");
								playStatus = "throw under";
							}
							
						}
						else if(checkSuit == thisRound.trumpSuit){
							app.log("I threw a trump, no other trumps in play, I am new on top");
							playStatus = "new on top";
						}
						else{
							app.log("I played a non-trump off-suit");
							playStatus = "throw under";
						}
						
					}
					
				}
				
				//Locate card in hand
				for(var c = 0; c < thisPlayer.hand.length; c++){
					var thisCard = thisPlayer.hand[c];
					if(thisCard == playThis){
						var playCard = thisCard;
						var cardIndex = c;
						app.log("Card located in hand at " + cardIndex);
					}
				}
				
				//play card to trick
				thisTrick.playedThisTrick[thisPlayer.id] = playThis;
				
				var t = "";
				for(var p in thisTrick.playedThisTrick){
					t += thisTrick.playedThisTrick[p] + ",";
				}
				app.log("Cards now in play: " + t);
				
				//update top status
				if(playStatus == "new on top"){
					thisTrick.topPlayer = thisPlayer.id;
					thisTrick.topSuit = playCard.suit;
					thisTrick.topValue = playCard.value;
					app.log("Player " + thisPlayer.id + " now holds the trick");
				}
				
				//update lead suit
				if(thisTrick.leadSuit == ""){
					thisTrick.leadSuit = playCard.suit;
					app.log("Lead suit is now " + thisTrick.leadSuit);
				}
				
				//update top in suit
				// !!! This needs to recursively check that the next card down has not previously been played.
				// !!! Top in Suit needs to be updated only after trick is complete !!! move this to updatePlayPhase and iterate through all playedToTrick cards
				if(playCard.toString() == thisRound.topInSuit[playCard.suit]){
					thisRound.topInSuit[playCard.suit] = playCard.getNextCard(-1);
					app.log("New top " + playCard.suit + " is " + thisRound.topInSuit[playCard.suit]);
				}
				
				//update out of suit
				if(playCard.suit != thisTrick.leadSuit){
					thisRound.outOfSuit[thisTrick.leadSuit][thisPlayer.id] = true;
					app.log("Player " + thisPlayer.id + " is out of " + thisTrick.leadSuit);
				}
				
				//remove card from hand
				thisPlayer.hand.splice(cardIndex, 1);
				
			}
			
		}

		
		
		this.cardInHand = function(n){
			for(var c in thisPlayer.hand){
				if(thisPlayer.hand[c].toString() == n){ return true; }
			}
			return false;
		}
		
		
		
		this.suitInHand = function(n){
			for(var c in thisPlayer.hand){
				if(thisPlayer.hand[c].suit == n){ return true; }
			}
			return false;		
		}



		this.getCard = function(direction, suit, trump){
		
			//This will select a card from the players hand to be played based on min/max parameters
			
			//ensure that our count and sort is current
			thisPlayer.sortHand("count");
			
			//evaluate the hand and select a card
			
			if(direction == "lowest"){
			
				if(suit == "least"){
				
					//find the lowest value card in nontrump suit of least count.
					app.log("looking for lowest value in least");
					var suits = Object.keys(thisPlayer.suitWeight);
					for(var s = 0; s < suits.length; s++){
						app.log("checking suit " + suits[s] + " per count");
						for(var c in thisPlayer.hand){
							var thisCard = thisPlayer.hand[c];
							app.log("check card " + c + " " + thisCard.value + thisCard.suit);
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								return thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left. (having been sorted, this will always be hand[0])
					return thisPlayer.hand[0].toString();
					
				}
				else if(suit == "most"){
				
					//find the lowest value card in nontrump suit of most count.
					app.log("looking for lowest value in most");
					var suits = Object.keys(thisPlayer.suitWeight);
					for(var s = suits.length - 1; s >= 0; s--){
						app.log("checking suit " + suits[s] + " per count");
						for(var c in thisPlayer.hand){
							var thisCard = thisPlayer.hand[c];
							app.log("check card " + c + " " + thisCard.value + thisCard.suit);
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								return thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left.
					return thisPlayer.hand[0].toString();
					
				}
				else{
				
					//find the lowest value card in specified suit
					app.log("looking for lowest in " + suit);
					//for(var c in thisPlayer.hand){
					for(var c = 0; c < thisPlayer.hand.length; c++){
						var thisCard = thisPlayer.hand[c];
						app.log("check card " + c + " " + thisCard.value + thisCard.suit);
						if(thisCard.suit == suit){
							return thisCard.toString();
						}
					}					
					
					//if nothing picked, player has no cards of specified suit.
					
					// TODO: apply error handling: this should not be reached. if it is, there is a flaw in AI logic
				
				}
				
			}
			else{
			
				if(suit == "least"){
				
					//find the highest value card in nontrump suit of least count.
					app.log("looking for highest value in least");
					var suits = Object.keys(thisPlayer.suitWeight);
					for(var s = 0; s < suits.length; s++){
						for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
							var thisCard = thisPlayer.hand[c];
							app.log("check card " + c + " " + thisCard.value + thisCard.suit);
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								return thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get highest value card left. (having been sorted, this will always be hand[0])
					return thisPlayer.hand[thisPlayer.hand.length].toString();
					
				}
				else if(suit == "most"){
				
					//find the highest value card in nontrump suit of most count.
					app.log("looking for highest value in most");
					var suits = Object.keys(thisPlayer.suitWeight);
					for(var s = suits.length - 1; s >= 0; s--){
						for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
							var thisCard = thisPlayer.hand[c];
							app.log("check card " + c + " " + thisCard.value + thisCard.suit);
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								return thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left.
					return thisPlayer.hand[thisPlayer.hand.length].toString();
					
				}
				else{
				
					//find the highest value card in specified suit
					app.log("looking for highest value " + suit);
					for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
						var thisCard = thisPlayer.hand[c];
						app.log("check card " + c + " " + thisCard.value + thisCard.suit);
						if(thisCard.suit == suit){
							app.log("picked card " + c);
							return thisCard.toString();
						}
					}					
					
					//if nothing picked, player has no cards of specified suit.
					
					// TODO: apply error handling: this should not be reached. if it is, there is a flaw in AI logic
				
				}				
			
			}
		
		}



		//Execute on Construct - - - - - - - - - - - - - 
		
		app.Player.lastID++;
		this.id = app.Player.lastID;
		
		if(aiMode == "Human"){
			this.name = "You";
		}
		else{
			this.name = aiMode + " AI";
		}
		
	}	
	
	//Player Class Static Members -------------------------------------------------------
	
	this.Player.lastID = -1;
	

			
	//Misc Utility Methods --------------------------------------------------------

	this.getRnd = function (minVal, maxVal) {
		if(minVal > 0){ return Math.floor((Math.random() * maxVal) + minVal); }
		return Math.floor((Math.random() * (++maxVal)));
	}
	
	
	
	this.wrapValue = function(minVal, maxVal, newVal){
		while(newVal > maxVal){
			newVal = newVal - maxVal - 1;
		}
		while(newVal < minVal){
			newVal = maxVal + newVal + 1;
		}
		return newVal;
	}

	
	
	this.getSortKeyIndex = function(hay, needle){
		for(var i in hay){
			if(hay[i][0] == needle){ return i; }
		}
		return false;
	}

	
	
	this.toUpperFirst = function(s){
		return s.substr(0, 1).toUpperCase() + s.substr(1);
	}

	
	
	this.pasteCard = function(c, e, x, y){
		
		var ce = $(c);
		
		//fade out
		ce.fadeOut('fast', function(){
		
			//reposition to paste location
			ce.detach().appendTo($(e));
			ce.css('left', x + "px");
			ce.css('top', y + "px");
			
			//fade in
			ce.fadeIn('fast');
			
		});
		
	}
	
	
	
	this.flipCard = function(c, d){
		
		var ce = $(c);
		var ci = c.substr(6);
		
		if(d == "up"){
			ce.html('<img src="img/cards/'+app.skin+'/'+ci+'.jpg" />');
		}
		else{
			ce.html('<img src="img/cards/'+app.skin+'/backface.jpg" />');
		}
		
	}


	
	this.log = function(s){
		if(params.writeDebug == true){
			console.log(s);
		}
	}
	
	
	
	//Execute on Construct - - - - - - - - - - - - -
	
	app.buildElements();
	
	app.bindHandlers();	
	
}	
