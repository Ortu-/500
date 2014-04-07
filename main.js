
//Define Application Namespace//

function App_FiveHundred() {

	//App Init -------------------------------------------------------------
	
	var app = this;
	
	this.suitVal = {"Spades": 1, "Clubs": 2, "Diamonds": 3, "Hearts": 4, "Joker": 5};
	
	this.baseSchedule = [];
		for(var i = 6; i < 10; i++){
			this.baseSchedule.push(i + " Spades");
			this.baseSchedule.push(i + " Clubs");
			this.baseSchedule.push(i + " Diamonds");
			this.baseSchedule.push(i + " Hearts");
			this.baseSchedule.push(i + " No-Trump");
		}

		
		
	//focus handler --------------------------------------------------------
	
	var currentFocus = "";

	
	
	//input handler --------------------------------------------------------
	
	this.bindHandlers = function(){
		
		$(document).on("keydown", function (e) {
			if (e.which === 13) {
				//$('#' + currentFocus).click();
				
				//start a game
				$('#main').html('starting');
				var thisGame = new app.Game('Easy', false);
			}
		});			
		
	}
	
	
	
	//Game Class ------------------------------------------------------------
	
	this.Game = function (difficulty, debug){
		
		//Game Init - - - - - - - - - - - - - - - - - -
		
		var g = this;
		
		this.debugMode = debug;
		this.aiMode = difficulty
		
		this.winner = 0;
		this.roundCount = 0;
		this.dealer = -1
	
		this.players = [];
		this.deck = [];
		
		
		
		//Define Game Methods - - - - - - - - - - - - - 
		
		this.shuffle = function(){
			
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
			
		}
		
		
		
		this.deal = function(){
			
			var count = 0;
			
			//deal in 3-2-3-2 pattern with 3 remainder to kitty
			for(var c = 0; c < g.deck.length; c++){
				
				var thisCard = g.deck[c];
				var thisPlayer = Math.floor(count / 10);
				
				if(thisPlayer < 5){
					g.players[thisPlayer].hand.push(new Card(thisCard.suit, thisCard.value));
					count++;
				}
			}
			
			//sort the hands
			for(var p = 0; p < g.players.length; p++){
				var thisPlayer = g.players[p];
				thisPlayer.sortHand();
			}
			
		}
		
		
		
		//Execute on Construct - - - - - - - - - - - - -
		
		//add players using specified difficulty
		var aiOption = [];
		
		switch(difficulty){
			case "Easy": aiOption = ['Easy']; break;
			case "Hard": aiOption = ['Hard']; break;
			case "Mixed": aiOption = ['Easy', 'Hard']; break;
		}
		
		//AI only play 
		/*for (int i = 0; i < 5; i++)
		{
			this.players[i] = new Player(aiOption[rnd.Next(0, aiOption.Length)]);
			WriteDebug("Made Player: " + i.ToString() + " (" + players[i].name + ")");
		}*/
		
		//Single player
		for(var i = 0; i < 4; i++){
			this.players[i] = new app.Player(aiOption[app.getRnd(0, aiOption.length)]);
		}
		this.players[4] = new app.Player("Human");		
		
		//start round 1
		var thisRound = new app.GameRound(thisGame);
		
	}

	
	
	//GameRound Class ------------------------------------------------------------
	
	this.GameRound = function(g){
		
		//GameRound Init - - - - - - - - - - - - - 
		
		var thisRound = this;
		
		this.passCount = 0;
		this.seatCount = 1;			
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
			
			var p = app.wrapValue(0, 5, g.dealer + thisRound.seatCount);
			var thisPlayer = g.players[p];
			
			//if player hasn't passed, make a bid
			if(thisPlayer.bidSuit != "pass" && thisRound.topBidPlayer != p){
			
				//make the bid
				if(thisPlayer.ai != "Human"){
					thisRound.playerBids[p] = thisPlayer.getBid(thisRound.topBidAmount, thisRound.topBidSuit);
					
					thisRound.updateBiddingResults(g, p);
				}
				else{
					//let the player make a bid
					
					//update available bid options: player can only make a bid higher than current top bid, or must pass.
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
					bs.animate({
						'margin-left':'0px'
					}, 800, function(){
						//on reveal callback
						//nothing to see here
					});
					
					//bind player bid select callback handler
					$('#select-playerBid').on('change', function(){ 
					// !!! may want to change this to execute on a submit button press to prevent accidental bids.

						//evaluate bid
						var playerBid = $(this).val();						
						var splitBid = playerBid.split(" ");
						
						thisPlayer.bidAmount = splitBid[0];
						thisPlayer.bidSuit = splitBid[1];
						
						thisRound.playerBids[p] = playerBid;
						
						//hide bid schedule
						var bs = $('#panel-bidSchedule');
						bs.animate({
							'margin-left':'1000px'
						}, 800, function(){
							//wait until panel is fully hidden to continue
							thisRound.updateBiddingResults(g, p);						
						});	

					});
					
				}	
			}
			
		}
		
		
		
		this.updateBiddingResults = function(g, p){
			
			var thisPlayer = g.players[p];
			
			//check bid result
			if(thisPlayer.bidSuit == "pass"){
				thisRound.passCount++;
			}
			else{
				//new high bid
				thisRound.topBidSuit = thisPlayer.bidSuit;
				thisRound.topBidAmount = thisPlayer.bidAmount;
				thisRound.topBidPlayer = p;
			}
			
			//check for winning bid || all passed
			if(thisRound.passCount > 4){
				thisRound.trumpSuit = "redeal";
			}
			else if(passCount == 4){
				//we have a winning bid
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
					
					//advance to team selection
					thisRound.runKittyPhase(g);
					
				}
				else{
					//start a new round
					g.thisRound = new GameRound(g);
				}			
			}
			else{
				//continue biding
				thisRound.seatCount++;
				thisRound.runBidPhase(g);
			}
		
		}
		
		
		
		this.runKittyPhase = function(g){
			
			var thisPlayer = g.players[thisRound.chief];
			
			//AI logic
			
			if(thisPlayer.ai != "Human"){

				//analyze hand
				thisPlayer.getSuitCount();
				
				//make a sub-copy that we can alter without affecting the original 
				var newCount = Object.create(thisPlayer.suitCount);
				
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
				for(var i in newCount){ sortedCount.push([i, newCount[i]]); }				
				sortedCount.sort(function(a, b){ return a[1] - b[1]; });
				
				//pet the kitty
				for(var i = 50; i < 53; i++){
					
					var madeTrade = false;
					var thisKittyCard = g.deck[i];
					
					//take trumps, aces in kitty for offsuit in hand with least counts. take king if more than 0.5 count (any 1 card) of king's suit.
					if(thisKittyCard.suit == thisRound.trumpSuit || thisKittyCard.value == 14 || (thisKittyCard.value == 13 && sortedCount[app.getSortKeyIndex(sortedCount, thisKittyCard.suit)][1] > 0.5)){
					
						//we want this card, pick a hand card to trade.
						
						// !!! stub !!!
					
					}
				}
			
			}
			else{
			
				//Human player, allow player to choose cards to swap and bind submit callback
				
				$('#btn-kitty-submit').on('click', function(){
				
					// !!! stub !!! execute the indicated card swaps then proceed to updateKittyPhase
				
				});
				
			}
			
		}
		
		
		this.updateKittyPhase = function(){
			
			// !!! stub !!!
					
		}


		
		this.runTeamPhase = function(g){
			
			// !!! stub !!!
			
		}
		
		
		this.updateTeamPhase = function(){
			
			// !!! stub !!!
					
		}
		
		
		
		this.runPlayPhase = function(g){
			
			// !!! stub !!!
			
		}
		
		
		this.updatePlayPhase = function(){
			
			// !!! stub !!!
					
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
			
			var foeOut = false;
			
			for(var p in g.players){
				if(thisRound.outOfSuit[suit][p.id]){
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
		}

		//update total round count
		g.roundCount++;
		
		//update dealer
		g.dealer = app.wrapValue(0, 4, g.dealer + 1);
		
		//play starts left of dealer
		this.nextLeadPlayer = app.wrapValue(0, 4, g.dealer + 1);
		
		//shuffle the deck
		g.shuffle();
		
		//deal the hands
		g.deal();
		
		//get the bids
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
		
		this.suitCount = {"Spades": 0.0, "Clubs": 0.0, "Diamonds": 0.0, "Hearts": 0.0 };
		
		
		
		//Define Player Methods - - - - - - - - - - - - - 

		this.sortHand = function(){
		
			//sort by values, then by suits, then by counts in suit
			thisPlayer.hand.sort(function(a, b){ return a.value - b.value; });
			thisPlayer.hand.sort(function(a, b){ return app.suitVal[a.suit] - app.suitVal[b.suit]; });
			thisPlayer.hand.sort(function(a, b){ return thisPlayer.suitCount[a.suit] - thisPlayer.suitCount[b.suit]; });
			
			/*
			//sort by values
			thisPlayer.hand.sort(function(a, b){
				var keyA = a.value;
				var keyB = b.value;
				if(keyA < keyB) return -1;
				if(keyA > keyB) return 1;
				return 0;
			});
			
			//then by suits
			thisPlayer.hand.sort(function(a, b){
				var keyA = app.suitVal[a.suit];
				var keyB = app.suitVal[b.suit];
				if(keyA < keyB) return -1;
				if(keyA > keyB) return 1;
				return 0;
			});
			
			//then by suit counts if AI player
			// ex: if you have 2 diamonds, and 4 spades, sort the diamonds to the front of the hand.
			// this is needed by the AI when choosing a card to play.
			if(thisPlayer.ai != "Human"){
				thisPlayer.getSuitCount();
				thisPlayer.hand.sort(function(a, b){
					var keyA = thisPlayer.suitCount[a.suit];
					var keyB = thisPlayer.suitCount[b.suit];
					if(keyA < keyB) return -1;
					if(keyA > keyB) return 1;
					return 0;
				});				
			}
			*/
		}
		
		
		
		this.getSuitCount = function(){
			
			/*
				This will evaluate the number of cards for each suit in the player's hand.
				It is used by the AI to determine bidding.
				It is a weighted count by card value such that a King counts higher in the decision making than a 2 for example.
				The current cut point is 8, if this is lowered, the AI is more likely to make higher bids, but will be less likely to be able to take the win the tricks.
			*/
			
			//reset the count
			thisPlayer.suitCount = {"Spades": 0.0, "Clubs": 0.0, "Diamonds": 0.0, "Hearts": 0.0 };
			
			for(var c in thisPlayer.hand){
				
				var thisCard = thisPlayer.hand[c];
				
				if(thisCard.suit != "Joker"){
					if(thisCard.value <= 8){
						thisPlayer.suitCount[thisCard.suit] += 0.5;
					}
					else{
						thisPlayer.suitCount[thisCard.suit] += 1.0;
					}
				}
				
			}
			
		}
		
		
		
		this.getBid = function(topBid, topSuit){
			
			// !!! stub !!!
			
		}
		
		
		
		this.playCard = function(g, thisRound, thisTrick){
			
			// !!! stub !!!
			
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

			var pickCard;
			
			//ensure that our count and sort is current
			thisPlayer.sortHand();
			
			//evaluate the hand and select a card
			
			if(direction == "lowest"){
			
				if(suit == "least"){
				
					//find the lowest value card in nontrump suit of least count.
					var suits = Object.keys(thisPlayer.suitCount);
					for(var s = 0; s < suits.length; s++){
						for(var c in thisPlayer.hand){
							var thisCard = thisPlayer.hand[c];
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								pickCard = thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left. (having been sorted, this will always be hand[0])
					pickCard = thisPlayer.hand[0].toString();
					
				}
				else if(suit == "most"){
				
					//find the lowest value card in nontrump suit of most count.
					var suits = Object.keys(thisPlayer.suitCount);
					for(var s = suits.length - 1; s >= 0; s--){
						for(var c in thisPlayer.hand){
							var thisCard = thisPlayer.hand[c];
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								pickCard = thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left.
					pickCard = thisPlayer.hand[0].toString();
					
				}
				else{
				
					//find the lowest value card in specified suit
					for(var c in thisPlayer.hand){
						var thisCard = thisPlayer.hand[c];
						if(thisCard.suit == suits[s]){
							pickCard = thisCard.toString();
						}
					}					
					
					//if nothing picked, player has no cards of specified suit.
					
					// !!! stub !!! apply error handling: this should not be reached. if it is, there is a flaw in AI logic
				
				}
				
			}
			else{
			
				if(suit == "least"){
				
					//find the highest value card in nontrump suit of least count.
					var suits = Object.keys(thisPlayer.suitCount);
					for(var s = 0; s < suits.length; s++){
						for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
							var thisCard = thisPlayer.hand[c];
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								pickCard = thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get highest value card left. (having been sorted, this will always be hand[0])
					pickCard = thisPlayer.hand[thisPlayer.hand.length].toString();
					
				}
				else if(suit == "most"){
				
					//find the highest value card in nontrump suit of most count.
					var suits = Object.keys(thisPlayer.suitCount);
					for(var s = suits.length - 1; s >= 0; s--){
						for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
							var thisCard = thisPlayer.hand[c];
							if(thisCard.suit == suits[s] && thisCard.suit != trump){
								pickCard = thisCard.toString();
							}
						}						
					}
					
					//if nothing picked, player has only trumps. get lowest value card left.
					pickCard = thisPlayer.hand[thisPlayer.hand.length].toString();
					
				}
				else{
				
					//find the highest value card in specified suit
					for(var c = thisPlayer.hand.length - 1; c >= 0; c--){
						var thisCard = thisPlayer.hand[c];
						if(thisCard.suit == suits[s]){
							pickCard = thisCard.toString();
						}
					}					
					
					//if nothing picked, player has no cards of specified suit.
					
					// !!! stub !!! apply error handling: this should not be reached. if it is, there is a flaw in AI logic
				
				}				
			
			}
			
			return pickCard;
		
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
		return Math.floor((Math.random() * maxVal) + minVal);
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
	
	
	
	this.getSortKeyIndex(hay, needle){
		for(var i in hay){
			if(hay[i][0] == needle){ return i; }
		}
		return false;
	}
	
	
	
	this.toUpperFirst = function(s){
		return s.substr(0, 1).toUpperCase() + s.substr(1);
	}
	
	
	
	this.pasteCard = function(c, x, y){
		
		// !!! stub !!!
		
	}
	
	
	
	this.writeDebug = function(s){
		if(app.debugMode == true){
			console.log(s);
		}
	}
	
	
	
	//Execute on Construct - - - - - - - - - - - - -
	
	app.bindHandlers();
	
}
