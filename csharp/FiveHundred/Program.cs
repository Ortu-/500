using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;

namespace FiveHundred
{
    class Program
    {
        class Game
        {
            //Game Init
            public static string    debugMode;
            public string           aiMode;
            public int              winner;
            public int              roundCount;
            public int              dealer;
            public GameRound        thisRound;
            public List<Card>       deck = new List<Card>();
            public Player[]         players = new Player[5];
            
            //Game Constructor
            public Game(string difficulty, string debug)
            {
                Console.WriteLine("Game created on '{0}' mode.\r\n", difficulty);

                debugMode   = debug;
                aiMode      = difficulty;
                winner      = 0;
                roundCount  = 0;
                dealer      = -1;

                //add the players using cmd line difficulty choice
                var rnd = new Random();
                string[] aiOption;
                switch (difficulty)
                {
                    case "Easy":    aiOption = new string[] { "Easy" };         break;
                    case "Hard":    aiOption = new string[] { "Hard" };         break;
                    case "Mixed":   aiOption = new string[] { "Easy", "Hard" }; break;
                    default:        aiOption = new string[] { "Easy" };         break;
                }
                
                /*
                //AI only play 
                for (int i = 0; i < 5; i++)
                {
                    players[i] = new Player(aiOption[rnd.Next(0, aiOption.Length)]);
                    WriteDebug("Made Player: " + i.ToString() + " (" + players[i].name + ")");
                }
                WriteDebug("");
                */
                
                //Single player
                for (int i = 0; i < 4; i++)
                {
                    players[i] = new Player(aiOption[rnd.Next(0, aiOption.Length)]);
                    WriteDebug("Made Player: " + i.ToString() + " (" + players[i].name + ")");
                }
                players[4] = new Player("Human");
                WriteDebug("Made Player: 4 (" + players[4].name + ")\r\n");
                

                //start round 1
                thisRound = new GameRound(this);
            }

            //Game Methods
            public void Shuffle()
            {
                Console.WriteLine("\r\nShuffling...\r\n");

                var rnd = new Random();

                //build the deck
                deck.Clear();
                for (int v = 2; v <= 14; v++)
                {
                    deck.Add(new Card("Spade", v));
                    deck.Add(new Card("Club", v));
                    deck.Add(new Card("Diamond", v));
                    deck.Add(new Card("Heart", v));
                }
                deck.Add(new Card("Joker", 17));

                //shuffle it
                for (int c = 0; c < deck.Count; c++)
                {
                    var card = deck[c];
                    int newSpot = rnd.Next(0, 52);
                    deck.RemoveAt(c);
                    deck.Insert(newSpot, card);
                }
            }

            public void Deal()
            {
                Console.WriteLine("Dealing the hand...\r\n");

                double count = 0;

                //deal in 3-2-3-2 pattern with 3 remainder to kitty
                foreach (Card thisCard in deck)
                {
                    int thisPlayer = (int)Math.Floor(count / 10);
                    if (thisPlayer < 5)
                    {
                        players[thisPlayer].hand.Add(new Card(thisCard.suit, thisCard.value));
                        count++;
                    }
                }

                //sort the hands
                foreach (Player thisPlayer in players)
                {
                    thisPlayer.SortHand();
                    WriteDebug(thisPlayer.ShowHand());
                }
                WriteDebug(deck[50].ToString() + ", " + deck[51].ToString() + ", " + deck[52].ToString());
            }
        }

        //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        class GameRound
        {
            //GameRound Init
            public int topBidAmount;
            public string topBidSuit;
            public int topBidPlayer;
            public int chief;
            public int vice1;
            public int vice2;
            public int viceLimit;
            public string trumpSuit;
            public Trick thisTrick;
            public int nextLeadPlayer;

            public Dictionary<string, Array> outOfSuit = new Dictionary<string, Array>();
            public Dictionary<string, string> topInSuit = new Dictionary<string, string>();

            public List<KeyValuePair<int, string>> playerBids = new List<KeyValuePair<int,string>>();

            //GameRound Constructor
            public GameRound(Game g)
            {
                //reset game round data
                topBidAmount            = 0;
                topBidSuit              = "";
                topBidPlayer            = -1;
                chief                   = -1;
                vice1                   = -1;
                vice2                   = -1;
                viceLimit               = 0;
                trumpSuit               = "";
                nextLeadPlayer          = -1;

                topInSuit = new Dictionary<string, string>()
                {
                    {"Spade", "AS"},
                    {"Club", "AC"},
                    {"Diamond", "AD"},
                    {"Heart", "AH"}
                };


                outOfSuit = new Dictionary<string, Array>()
                {
                    {"Spade", new bool[]{false, false, false, false, false}},
                    {"Club", new bool[]{false, false, false, false, false}},
                    {"Diamond", new bool[]{false, false, false, false, false}},
                    {"Heart", new bool[]{false, false, false, false, false}}
                };

                List<KeyValuePair<int, string>> playerBids = new List<KeyValuePair<int, string>>();

                //reset player round data
                for (int p = 0; p < 5; p++)
                {
                    g.players[p].bidSuit = "";
                    g.players[p].bidAmount = 0;
                    g.players[p].tricks = 0;
                }

                //update total round count
                g.roundCount++;
                Console.WriteLine(PrintLine("*"));
                Console.WriteLine("Starting Round {0}", g.roundCount);

                //update dealer
                g.dealer = WrapValue(0, 4, g.dealer + 1);
                Console.WriteLine("\r\nPlayer " + g.dealer.ToString() + " (" + g.players[g.dealer].name + ") is now the dealer.");

                //play starts left of dealer
                nextLeadPlayer = WrapValue(0, 4, g.dealer + 1);

                //shuffle the deck
                g.Shuffle();

                //deal the hands
                g.Deal();

                //get the bids
                RunBidPhase(g);
            }

            //GameRound Methods
            public void RunBidPhase(Game g)
            {
                Console.WriteLine("Start Bid Phase...\r\n");

                Player thisPlayer;
                int p;
                int passCount = 0;
                while (trumpSuit == "")
                {
                    //cycle players starting left of dealer
                    for (int pl = g.dealer + 1; pl < g.dealer + 6; pl++)
                    {
                        if (pl > 4)
                        { 
                            p = pl - 5;
                            thisPlayer = g.players[p]; 
                        }
                        else
                        {
                            p = pl;
                            thisPlayer = g.players[p]; 
                        }

                        //if player hasn't passed, make a bid
                        if(thisPlayer.bidSuit != "pass" && topBidPlayer != p)
                        {
                            WriteDebug(PrintLine("-"));
                            WriteDebug("\r\nProcessing player "+ p + " (" + thisPlayer.name + ")");

                            //make the bid
                            if (thisPlayer.ai != "Human")
                            {
                                playerBids.Add(new KeyValuePair<int, string>(p, thisPlayer.GetBid(topBidAmount, topBidSuit)));
                            }
                            else
                            {
                                //let the player make a bid
                                // ********* incomplete! : no handling for a No Trump winning bid case yet, remove from schedule until implemented.
                                Console.WriteLine("\r\n-Bidding Schedule-");
                                Console.WriteLine("'6 Spade'     =  40 points");
                                Console.WriteLine("'6 Club'      =  60 points");
                                Console.WriteLine("'6 Diamond'   =  80 points");
                                Console.WriteLine("'6 Heart'     = 100 points");
                                //Console.WriteLine("'6 No Trump'  = 120 points");
                                Console.WriteLine("'7 Spade'     = 140 points");
                                Console.WriteLine("'7 Club'      = 160 points");
                                Console.WriteLine("'7 Diamond'   = 180 points");
                                Console.WriteLine("'7 Heart'     = 200 points");
                                //Console.WriteLine("'7 No Trump'  = 220 points");
                                Console.WriteLine("'8 Spade'     = 240 points");
                                Console.WriteLine("'8 Club'      = 260 points");
                                Console.WriteLine("'8 Diamond'   = 280 points");
                                Console.WriteLine("'8 Heart'     = 300 points");
                                //Console.WriteLine("'8 No Trump'  = 320 points");
                                Console.WriteLine("'9 Spade'     = 340 points");
                                Console.WriteLine("'9 Club'      = 360 points");
                                Console.WriteLine("'9 Diamond'   = 380 points");
                                Console.WriteLine("'9 Heart'     = 400 points");
                                //Console.WriteLine("'9 No Trump'  = 420 points");
                                Console.WriteLine("'10 Spade'    = 440 points");
                                Console.WriteLine("'10 Club'     = 460 points");
                                Console.WriteLine("'10 Diamond'  = 480 points");
                                Console.WriteLine("'10 Heart'    = 500 points");
                                //Console.WriteLine("'10 No Trump' = 520 points");
                                Console.WriteLine("'Pass'\r\n");
                                Console.WriteLine(GetCurrentBids());
                                Console.WriteLine("Your hand: " + thisPlayer.ShowHand());

                                string playerBid = "";
                                bool bidIsValid = false;
                                while (bidIsValid == false)
                                {
                                    Console.Write("Please enter your bid >> ");
                                    playerBid = Console.ReadLine();

                                    if (playerBid.ToLower() != "pass")
                                    {
                                        WriteDebug("user did not pass, parse bid...");
                                        string[] splitBid;
                                        splitBid = playerBid.Split(default(string[]), StringSplitOptions.RemoveEmptyEntries);
                                        splitBid = playerBid.Split((string[])null, StringSplitOptions.RemoveEmptyEntries);
                                        splitBid = playerBid.Split(null as string[], StringSplitOptions.RemoveEmptyEntries);
                                        try
                                        {
                                            thisPlayer.bidAmount = Convert.ToInt16(splitBid[0]);
                                            bidIsValid = true;
                                            WriteDebug("parsed amount from [0] = " + thisPlayer.bidAmount.ToString());
                                        }
                                        catch
                                        {
                                            Console.WriteLine("Invalid bid entered, could not parse bid amount. Must enter in the form of '# suit'");
                                        }
                                        if (bidIsValid)
                                        {
                                            bidIsValid = false;
                                            thisPlayer.bidSuit = ToUpperFirst(splitBid[1]);
                                            WriteDebug("parsed suit from [1] = " + thisPlayer.bidSuit);
                                            try
                                            {
                                                if (splitBid[2].ToLower() == "trump")
                                                {
                                                    WriteDebug("parsed suit from [2] = " + splitBid[2]);
                                                    thisPlayer.bidSuit += " Trump";
                                                }
                                            }
                                            catch{}
                                        }

                                        //validate
                                        if (thisPlayer.bidAmount >= 6 && thisPlayer.bidAmount <= 10)
                                        {
                                            if (thisPlayer.bidSuit == "Spade" || thisPlayer.bidSuit == "Club" || thisPlayer.bidSuit == "Diamond" || thisPlayer.bidSuit == "Heart" || thisPlayer.bidSuit == "No Trump")
                                            {
                                                bidIsValid = true;
                                                playerBids.Add(new KeyValuePair<int, string>(p, thisPlayer.bidAmount+" "+thisPlayer.bidSuit));
                                                WriteDebug("Bid is valid. " + thisPlayer.bidAmount + " " + thisPlayer.bidSuit);
                                            }
                                        }
                                    }
                                    else
                                    {
                                        WriteDebug("user passed.");
                                        thisPlayer.bidAmount = 0;
                                        thisPlayer.bidSuit = "pass";
                                        playerBids.Add(new KeyValuePair<int, string>(p, "0 pass"));
                                        bidIsValid = true;
                                    }
                                }

                                Console.WriteLine("\r\nYou bid " + thisPlayer.bidAmount.ToString()+" "+thisPlayer.bidSuit+"\r\n");
                                //Console.WriteLine(GetCurrentBids());
                                //Console.WriteLine("Press any key to continue.");
                                //Console.ReadKey();
                            }

                            //check bid result
                            if (thisPlayer.bidSuit == "pass")
                            {
                                passCount++;
                            }
                            else
                            {
                                //new high bid
                                topBidSuit = thisPlayer.bidSuit;
                                topBidAmount = thisPlayer.bidAmount;
                                topBidPlayer = p;
                                WriteDebug("Player " + p.ToString() + " is now top bidder with " + topBidAmount.ToString() + " " + topBidSuit);
                            }
                        }
                    }

                    //check for winning bid || all pass
                    if (passCount > 4)
                    {
                        //everyone passed, redeal the hand and start a new round
                        trumpSuit = "redeal";
                    }
                    else if(passCount == 4)
                    {
                        //we have a winning bid
                        trumpSuit = topBidSuit;
                        chief = topBidPlayer;
                        if (topBidAmount < 8)
                        {
                            viceLimit = 1;
                        }
                        else
                        {
                            viceLimit = 2;
                        }
                    }
                }

                //trump suit selected, advance to team phase or redeal
                if (trumpSuit != "redeal")
                {
                    Console.WriteLine("\r\nPlayer " + topBidPlayer + "("+g.players[topBidPlayer].name+") won the bid with " + topBidAmount + " " + topBidSuit + "\r\n");
                    Console.WriteLine("Press any key to continue.");
                    Console.ReadKey();

                    WriteDebug("Converting bower suits and values to this round trump suit....");
                    //convert jacks/joker to bowers/trump suit
                    //check players
                    foreach (Player pl in g.players)
                    {
                        foreach (Card c in pl.hand)
                        {
                            SetBowers(c);
                        }
                    }
                    //check kitty
                    for (int c = 50; c < 53; c++)
                    {
                        SetBowers(g.deck[c]);

                    }
                    
                    RunTeamPhase(g);
                }
                else
                {
                    g.thisRound = new GameRound(g);
                }
            }

            public void RunTeamPhase(Game g)
            {
                Console.WriteLine("\r\nChief is taking the kitty...");

                Player thisPlayer = g.players[chief];

                //analyze hand
                thisPlayer.GetSuitCount();
                List<KeyValuePair<string, double>> dropSuit = thisPlayer.suitCount.ToList();

                WriteDebug("Initial hand count:\r\n"+thisPlayer.ShowHand());
                foreach (KeyValuePair<string, double> p in dropSuit)
                {
                    WriteDebug(p.Key + ": " + p.Value.ToString());
                }

                //check for low count suits to trade off, ignore aces in counts we want to keep them in hand
                WriteDebug("\r\nDropping Aces from counts...");
                foreach (Card c in thisPlayer.hand)
                {
                    if (c.value == 14 && c.suit != trumpSuit) //*** probably should also keep kings if consecutive with their ace ***
                    {
                        int dropThis = GetListKeyValueIndex(dropSuit, c.suit);
                        double addThis = dropSuit[dropThis].Value - 1.0;
                        dropSuit.RemoveAt(dropThis);
                        dropSuit.Add(new KeyValuePair<string, double>(c.suit, addThis));
                    }
                }

                //sort suits by new count ASC
                dropSuit.Sort((a, b) =>
                    {
                        return a.Value.CompareTo(b.Value);
                    }
                );

                WriteDebug("New Sorted disposables count:");
                foreach (KeyValuePair<string, double> p in dropSuit)
                {
                    WriteDebug(p.Key + ": " + p.Value.ToString());
                }

                //pet the kitty
                int traded = 0;
                for (int i = 50; i < 53; i++)
                {
                    traded = 0;
                    Card thisKittyCard = g.deck[i];
                    //take trumps, aces in kitty for offsuit in hand with least counts. take king if more than 1 count of king's suit.
                    if (thisKittyCard.suit == trumpSuit || thisKittyCard.value == 14 || (thisKittyCard.value == 13 && dropSuit[GetListKeyValueIndex(dropSuit, thisKittyCard.suit)].Value > 1))
                    {
                        //wanted card found in kitty, pick a hand card to trade out
                        for (int s = 0; s < 3; s++)
                        {
                            foreach (Card handCard in thisPlayer.hand)
                            {
                                if (traded == 0)
                                {
                                    if (handCard.suit == dropSuit[s].Key && handCard.suit != trumpSuit && handCard.value != 14)
                                    {
                                        //card selected, make the trade
                                        WriteDebug("\r\nTrading " + handCard.ToString() + " for " + thisKittyCard.ToString());
                                        string tempSuit = thisKittyCard.suit;
                                        int tempVal = thisKittyCard.value;

                                        thisKittyCard.suit = handCard.suit;
                                        thisKittyCard.value = handCard.value;

                                        double addThis = dropSuit[s].Value - 1.0;
                                        dropSuit.RemoveAt(s);
                                        dropSuit.Add(new KeyValuePair<string, double>(handCard.suit, addThis));

                                        handCard.suit = tempSuit;
                                        handCard.value = tempVal;

                                        traded = 1;

                                        //resort hand
                                        thisPlayer.SortHand();

                                        WriteDebug("Hand is now " + thisPlayer.ShowHand());
                                        WriteDebug("Kitty is now "+g.deck[50].ToString() + ", " + g.deck[51].ToString() + ", " + g.deck[52].ToString());
                                        WriteDebug("New Sorted disposables count:");
                                        foreach (KeyValuePair<string, double> p in dropSuit)
                                        {
                                            WriteDebug(p.Key + ": " + p.Value.ToString());
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else
                    {
                        //trade offsuit with count 1 for offsuit with higher count
                        for (int s = 0; s < 3; s++)
                        {
                            if (dropSuit[s].Value == 1 && dropSuit[s].Key != thisKittyCard.suit && dropSuit[GetListKeyValueIndex(dropSuit, thisKittyCard.suit)].Value > 1)
                            {
                                foreach (Card handCard in thisPlayer.hand)
                                {
                                    if (traded == 0)
                                    {
                                        if (handCard.suit == dropSuit[s].Key && handCard.suit != trumpSuit && handCard.value != 14 && dropSuit[GetListKeyValueIndex(dropSuit, handCard.suit)].Value > 1)
                                        {
                                            //card selected, make the trade
                                            Console.WriteLine("\r\nTrading " + handCard.ToString() + " for " + thisKittyCard.ToString());
                                            string tempSuit = thisKittyCard.suit;
                                            int tempVal = thisKittyCard.value;

                                            thisKittyCard.suit = handCard.suit;
                                            thisKittyCard.value = handCard.value;

                                            double addThis = dropSuit[s].Value - 1.0;
                                            dropSuit.RemoveAt(s);
                                            dropSuit.Add(new KeyValuePair<string, double>(handCard.suit, addThis));

                                            handCard.suit = tempSuit;
                                            handCard.value = tempVal;

                                            traded = 1;

                                            //resort hand
                                            thisPlayer.SortHand();

                                            WriteDebug("Hand is now " + thisPlayer.ShowHand());
                                            WriteDebug("Kitty is now " + g.deck[50].ToString() + ", " + g.deck[51].ToString() + ", " + g.deck[52].ToString());
                                            WriteDebug("New Sorted disposables count:");
                                            foreach (KeyValuePair<string, double> p in dropSuit)
                                            {
                                                WriteDebug(p.Key + ": " + p.Value.ToString());
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                thisPlayer.SortHand();
                WriteDebug("\r\nFinal Hand: " + thisPlayer.ShowHand());

                //pick team
                Console.WriteLine("\r\nPicking Team...");

                //vice 1
                if (thisPlayer.ai == "Easy")
                {
                    //pick random vice
                    var rnd = new Random();
                    vice1 = chief;
                    while (vice1 == chief)
                    {
                        vice1 = rnd.Next(0, 4);
                    }
                }
                else if (thisPlayer.ai == "Hard")
                {
                    //pick by criteria: bids made, play order, points etc
                    /*
                    //Do I have RB?
                    if()
                    {
                        //Do I have LB?
                        if()
                        {
                            //Do I have JK?
                            if()
                            {
                                //Did anyone bid an opposite suit? (if trump red => any black?)
                                if()
                                {
                                    //pick highest opposite bidder
                                }
                            }
                            else
                            {
                                //Did anyone bid trump suit?
                                if()
                                {
                                    //pick highest trump bidder

                                }
                            }
                        }
                        else
                        {
                            //Did anyone bid sister suit? (if trump heart => any diamond?)
                            if()
                            {
                                //pick highest sister bidder

                            }
                            else
                            {
                                //Did anyone bid trump suit?
                                if()
                                {
                                    //pick highest trump bidder

                                }
                            }
                        }
                    }
                    else
                    {
                        //Did anyone bid trump suit?
                        if()
                        {
                            //pick highest trump bidder

                        }
                        else
                        {
                            //Did anyone bid sister suit?
                            if()
                            {
                                //pick highest sister bidder

                            }
                        }
                    }
                    //If no one picked, did anyone else bid?
                    if()
                    {
                        //pick highest bidder

                    }
                    else
                    {
                        //pick random

                    }*/

                    //********* incomplete!
                }
                else
                {
                    //let player choose a team mate
                    bool teamValid = false;
                    while (teamValid == false)
                    {
                        Console.Write("Choose a team mate (0-3) >> ");
                        string picked = Console.ReadLine();
                        try
                        {
                            vice1 = Convert.ToInt16(picked);
                        }
                        catch
                        {

                        }
                        if (vice1 >= 0 && vice1 <= 3)
                        {
                            teamValid = true;
                        }
                        else
                        {
                            Console.WriteLine(PrintLine("!"));
                            Console.WriteLine("You must enter a number 0-3.");
                        }
                    }
                }
                Console.WriteLine("Player " + vice1.ToString() + " chosen as Vice.");

                //vice 2
                if (viceLimit == 2)
                {
                    if (thisPlayer.ai == "Easy")
                    {
                        //pick random vice
                        var rnd = new Random();
                        vice2 = chief;
                        while (vice2 == chief || vice2 == vice1)
                        {
                            vice2 = rnd.Next(0, 4);
                        }
                    }
                    else if (thisPlayer.ai == "Hard")
                    {
                        //pick by criteria: bids made, play order, points etc

                        //************ incomplete!
                    }
                    else
                    {
                        //let player choose a team mate
                        bool teamValid = false;
                        while (teamValid == false)
                        {
                            Console.Write("Choose a team mate (0-3) >> ");
                            string picked = Console.ReadLine();
                            try
                            {
                                vice2 = Convert.ToInt16(picked);
                            }
                            catch
                            {

                            }
                            if (vice2 >= 0 && vice2 <= 3)
                            {
                                teamValid = true;
                            }
                            else
                            {
                                Console.WriteLine(PrintLine("!"));
                                Console.WriteLine("You must enter a number 0-3.");
                            }
                        }
                    }
                    Console.WriteLine("Player " + vice2.ToString() + " also chosen as Vice.");
                }

                Console.WriteLine("\r\nPress any key to continue.");
                Console.ReadKey();

                //advance to play phase
                RunPlayPhase(g);
            }

            public void RunPlayPhase(Game g)
            {
                Console.WriteLine("\r\nBeginning play of tricks...");
                Console.WriteLine("Player " + g.players[g.dealer].id.ToString() + " is dealing.\r\n");

                //each round consist of 10 tricks
                for (int trick = 0; trick < 10; trick++)
                {
                    thisTrick = new Trick();

                    //play starts left of dealer on trick 1, or previous trick winner
                    thisTrick.leadPlayer = nextLeadPlayer;
                    Console.WriteLine(PrintLine("-"));
                    Console.WriteLine("Beginning trick " + (trick + 1).ToString()+"...");

                    //each player must play a card
                    for (int pl = thisTrick.leadPlayer; pl < thisTrick.leadPlayer + 5; pl++)
                    {
                        int p = WrapValue(0, 4, pl);
                        g.players[p].PlayCard(g, this, thisTrick);
                    }

                    //trick complete, give to top player
                    Console.WriteLine(PrintLine("_"));
                    Console.WriteLine("Trick complete.");
                    Console.WriteLine("Player " + thisTrick.topPlayer.ToString() + " took the trick.\r\n");
                    for (int i = 0; i < 5; i++)
                    {
                        Console.WriteLine("Player "+i+": "+thisTrick.playedThisTrick[i]);
                    }
                    Console.WriteLine("\r\nPress any key to continue.\r\n");
                    Console.ReadKey();

                    g.players[thisTrick.topPlayer].tricks++;

                    //trick winner leads the next trick
                    nextLeadPlayer = thisTrick.topPlayer;
                }

                //Round finished. Did chief make the bid?
                Console.WriteLine(PrintLine("_"));
                Console.WriteLine("Round complete.");

                int winningPlayer = -1;
                
                int teamTricks = g.players[chief].tricks;
                if (vice1 > -1)
                {
                    teamTricks += g.players[vice1].tricks;
                }
                if (vice2 > -1)
                {
                    teamTricks += g.players[vice2].tricks;
                }
                Console.WriteLine("Chief's team took " + teamTricks.ToString() + " tricks.");

                //calculate team point change
                int pointChange = 0;
                if (teamTricks >= topBidAmount)
                {
                    //chief made his bid, give points to team
                    Console.WriteLine("Team made the bid.");
                    pointChange = GetBidPoints(topBidSuit, topBidAmount);
                }
                else
                {
                    //chief was set, take points from team
                    Console.WriteLine("Team was set.");
                    pointChange = GetBidPoints(topBidSuit, topBidAmount) * -1;
                }

                //update team points
                Console.WriteLine("Team members points will change by " + pointChange);
                for (int p = 0; p < 5; p++)
                {
                    if (p == chief || p == vice1 || p == vice2)
                    {
                        g.players[p].score += pointChange;
                        
                        //check for win
                        if (g.players[p].score >= 500)
                        {
                            winningPlayer = p;
                        }
                        //limit losses
                        if (g.players[p].score <= -500)
                        {
                            g.players[p].score = -500;
                        }
                    }
                }

                //update nonteam points (10 per trick)
                for (int p = 0; p < 5; p++)
                {
                    if (p != chief && p != vice1 && p != vice2)
                    {
                        g.players[p].score += (g.players[p].tricks * 10);
                        Console.WriteLine("Player " + p.ToString() + " gains " + (g.players[p].tricks * 10).ToString() + " points.");
                        //check for win
                        if (g.players[p].score >= 500)
                        {
                            winningPlayer = p;
                        }
                    }
                }

                Console.WriteLine("\r\nScore is now:");
                for (int p = 0; p < 5; p++)
                {
                    Console.WriteLine("Player " + p.ToString() + ": " + g.players[p].score);
                }

                //Continue the game?
                if (winningPlayer > -1)
                {
                    //We have a winner!
                    Console.WriteLine("\r\nPlayer " + winningPlayer.ToString() + " won the game in " + g.roundCount.ToString() + " rounds!");
                    Console.ReadKey();
                }
                else
                {
                    //play another round
                    Console.WriteLine("\r\nNo winner yet");
                    Console.WriteLine("Press any key to continue the game.");
                    Console.ReadKey();
                    g.thisRound = new GameRound(g);
                }
            }

            public int GetBidPoints(string suit, int amount)
            {
                int points = (100 * amount) - 580;
                switch (suit)
                {
                    case "Spade": points += 20; break;
                    case "Club": points += 40; break;
                    case "Diamond": points += 60; break;
                    case "Heart": points += 80; break;
                    case "No Trump": points += 100; break;
                }

                return points;
            }

            public string GetCurrentBids()
            {
                int roundCount = 0;
                string bids = "Current Bids:\r\n";
                foreach (KeyValuePair<int, string> b in playerBids)
                {
                    bids += "Player "+b.Key.ToString()+": "+b.Value+"\r\n";
                    roundCount++;
                    if (roundCount == 5)
                    {
                        bids += "-----\r\n";
                        roundCount = 0;
                    }
                }
                return bids;
            }

            public void SetBowers(Card c)
            {
                //set joker to trump suit
                if (c.ToString() == "JK")
                {
                    c.suit = trumpSuit;
                }

                topInSuit[trumpSuit] = "JK";

                //set bowers
                switch (trumpSuit)
                {
                    case "Spade":
                        if (c.ToString() == "JS")
                        {
                            c.value = 16;
                            c.suit = trumpSuit;
                        }
                        if (c.ToString() == "JC")
                        {
                            c.value = 15;
                            c.suit = trumpSuit;
                        }
                        break;
                    case "Club":
                        if (c.ToString() == "JC")
                        {
                            c.value = 16;
                            c.suit = trumpSuit;
                        }
                        if (c.ToString() == "JS")
                        {
                            c.value = 15;
                            c.suit = trumpSuit;
                        }
                        break;
                    case "Diamond":
                        if (c.ToString() == "JD")
                        {
                            c.value = 16;
                            c.suit = trumpSuit;
                        }
                        if (c.ToString() == "JH")
                        {
                            c.value = 15;
                            c.suit = trumpSuit;
                        }
                        break;
                    case "Heart":
                        if (c.ToString() == "JH")
                        {
                            c.value = 16;
                            c.suit = trumpSuit;
                        }
                        if (c.ToString() == "JD")
                        {
                            c.value = 15;
                            c.suit = trumpSuit;
                        }
                        break;
                }
            }

            public bool FoeCanTrump(string suit, Player[] players, int id, int myTeam1, int myTeam2)
            {
                bool foeOut = false;
                foreach (Player p in players)
                {
                    if ((bool)outOfSuit[suit].GetValue(p.id))
                    {
                        //someone is out, are they on my team?
                        if (p.id != myTeam1 && p.id != myTeam2 && p.id != id)
                        {
                            //it is opponent
                            WriteDebug("Opponent Player " + p.id.ToString() + " is out of " + suit);
                            foeOut = true;
                        }
                    }
                }
                return foeOut;
            }
        }

        //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        class Trick
        {
            //Trick Init
            public int      leadPlayer;
            public string   leadSuit;
            public string   topSuit;
            public int      topValue;
            public int      topPlayer;
            public string[]   playedThisTrick = new string[5];

            //Trick Constructor
            public Trick()
            {
                leadPlayer = -1;
                leadSuit = "";
                topSuit = "";
                topValue = 0;
                topPlayer = -1;

                for (int i = 0; i < 5; i++)
                {
                    playedThisTrick[i] = "";
                }
            }

            //Trick Methods
            public bool TrumpInPlay(string trumpSuit)
            {
                foreach (string c in playedThisTrick)
                {
                    if (c != null && c != "")
                    {
                        string thisSuit = c.Substring(1, 1);
                        if (thisSuit == "B" || thisSuit == "K" || thisSuit == trumpSuit.Substring(0, 1))
                        {
                            return true;
                        }
                    }
                }
                return false;
            }

            public bool TopInPlay(string topCard)
            {
                foreach (string c in playedThisTrick)
                {
                    if (c == topCard)
                    {
                        return true;
                    }
                }
                return false;
            }
        }

        //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        class Card
        {
            //Card Init
            public string suit;
            public int value;

            //Card Constructor
            public Card(string s, int v)
            {
                suit = s;
                value = v;
            }

            //Card Methods
            public override string ToString()
            {
                switch (value)
                {
                    case 2: return "2" + suit.Substring(0, 1);
                    case 3: return "3" + suit.Substring(0, 1);
                    case 4: return "4" + suit.Substring(0, 1);
                    case 5: return "5" + suit.Substring(0, 1);
                    case 6: return "6" + suit.Substring(0, 1);
                    case 7: return "7" + suit.Substring(0, 1);
                    case 8: return "8" + suit.Substring(0, 1);
                    case 9: return "9" + suit.Substring(0, 1);
                    case 10: return "10" + suit.Substring(0, 1);
                    case 11: return "J" + suit.Substring(0, 1);
                    case 12: return "Q" + suit.Substring(0, 1);
                    case 13: return "K" + suit.Substring(0, 1);
                    case 14: return "A" + suit.Substring(0, 1);
                    case 15: return "LB";
                    case 16: return "RB";
                    case 17: return "JK";
                    default: return "err!";
                }
            }

            public string ToStringFull()
            {
                switch (value)
                {
                    case 2: return "Two of " + suit.Substring(0, 1) + "s";
                    case 3: return "Three of " + suit.Substring(0, 1) + "s";
                    case 4: return "Four of " + suit.Substring(0, 1) + "s";
                    case 5: return "Five of " + suit.Substring(0, 1) + "s";
                    case 6: return "Six of " + suit.Substring(0, 1) + "s";
                    case 7: return "Seven of " + suit.Substring(0, 1) + "s";
                    case 8: return "Eight of " + suit.Substring(0, 1) + "s";
                    case 9: return "Nine of " + suit.Substring(0, 1) + "s";
                    case 10: return "Ten of " + suit.Substring(0, 1) + "s";
                    case 11: return "Jack of " + suit.Substring(0, 1) + "s";
                    case 12: return "Queen of " + suit.Substring(0, 1) + "s";
                    case 13: return "King of " + suit.Substring(0, 1) + "s";
                    case 14: return "Ace of " + suit.Substring(0, 1) + "s";
                    case 15: return "Left Bower";
                    case 16: return "Right Bower";
                    case 17: return "Joker";
                    default: return "err!";
                }
            }

            public string GetNextCard(int offset)
            {
                WriteDebug("Getting card offset " + offset.ToString() + " from " + this.ToString());

                int pickVal = value + offset;
                if (pickVal < 2) { pickVal = 2; }
                if (pickVal > 17) { pickVal = 17;}
                
                switch (pickVal)
                {
                    case 2: return "2" + suit.Substring(0, 1);
                    case 3: return "3" + suit.Substring(0, 1);
                    case 4: return "4" + suit.Substring(0, 1);
                    case 5: return "5" + suit.Substring(0, 1);
                    case 6: return "6" + suit.Substring(0, 1);
                    case 7: return "7" + suit.Substring(0, 1);
                    case 8: return "8" + suit.Substring(0, 1);
                    case 9: return "9" + suit.Substring(0, 1);
                    case 10: return "10" + suit.Substring(0, 1);
                    case 11: return "J" + suit.Substring(0, 1);
                    case 12: return "Q" + suit.Substring(0, 1);
                    case 13: return "K" + suit.Substring(0, 1);
                    case 14: return "A" + suit.Substring(0, 1);
                    case 15: return "LB";
                    case 16: return "RB";
                    case 17: return "JK";
                    default: return "err!";
                }
            }
        }

        //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        class Player
        {
            //Player Init
            public int id;
            public static int lastId = -1;

            public int score;
            public int tricks;
            public string ai;
            public string name;

            public List<Card> hand = new List<Card>();

            public string bidSuit;
            public int bidAmount;

            public Dictionary<string, double> suitCount = new Dictionary<string, double>()
            {
                {"Spade", 0.0},
                {"Club", 0.0},
                {"Diamond", 0.0},
                {"Heart", 0.0}
            };

            //Player Constructor
            public Player(string aiMode)
            {
                lastId++;
                id = lastId;

                score = 0;
                tricks = 0;

                ai = aiMode;
                if (ai == "Human")
                {
                    name = "You";
                }
                else
                {
                    name = ai + " AI";
                }
            }

            //Player Methods
            public void SortHand()
            {
                hand = hand.OrderBy(a => suitVal[a.suit]).ThenBy(a => a.value).ToList();
            }

            public string ShowHand()
            {
                string handStr = "";
                foreach (Card c in hand)
                {
                    handStr += c.ToString() + ", ";
                }
                return handStr;
            }

            public void GetSuitCount()
            {
                suitCount["Spade"] = 0.0;
                suitCount["Club"] = 0.0;
                suitCount["Diamond"] = 0.0;
                suitCount["Heart"] = 0.0;
                foreach (Card c in hand)
                {
                    if (c.suit != "Joker") {
                        if (c.value <= 8)
                        {
                            suitCount[c.suit] += 0.5;
                        }
                        else
                        {
                            suitCount[c.suit] += 1.0;
                        }
                    }
                }
            }

            public string GetBid(int topBid, string topSuit)
            {
                Console.Write(name + " is making a bid...");
                WriteDebug(ShowHand());
                
                //analyze hand
                GetSuitCount();
                WriteDebug("Suit Count: "+suitCount["Spade"].ToString() + "S, " + suitCount["Club"].ToString() + "C, " + suitCount["Diamond"].ToString() + "D, " + suitCount["Heart"].ToString() + "H, ");

                Dictionary<string, double> trumpCount = new Dictionary<string, double>()
                {
                    {"Spade", suitCount["Spade"]},
                    {"Club", suitCount["Club"]},
                    {"Diamond", suitCount["Diamond"]},
                    {"Heart", suitCount["Heart"]}
                };

                foreach (Card c in hand)
                {
                    if (c.suit == "Spade")
                    {
                        if (c.value == 11)  //Jack = potential Bower
                        {
                            trumpCount["Club"]++;
                        }
                        if (c.value == 14) //Ace is ace! but still not quite in suit.
                        {
                            trumpCount["Club"] += 0.5;
                            trumpCount["Diamond"] += 0.5;
                            trumpCount["Heart"] += 0.5;
                        }
                    }
                    if (c.suit == "Club")
                    {
                        if (c.value == 11)
                        {
                            trumpCount["Spade"]++;
                        }
                        if (c.value == 14)
                        {
                            trumpCount["Spade"] += 0.5;
                            trumpCount["Diamond"] += 0.5;
                            trumpCount["Heart"] += 0.5;
                        }
                    }
                    if (c.suit == "Diamond")
                    {
                        if (c.value == 11)
                        {
                            trumpCount["Heart"]++;
                        }
                        if (c.value == 14)
                        {
                            trumpCount["Club"] += 0.5;
                            trumpCount["Spade"] += 0.5;
                            trumpCount["Heart"] += 0.5;
                        }
                    }
                    if (c.suit == "Heart")
                    {
                        if (c.value == 11)
                        {
                            trumpCount["Diamond"]++;
                        }
                        if (c.value == 14)
                        {
                            trumpCount["Club"] += 0.5;
                            trumpCount["Diamond"] += 0.5;
                            trumpCount["Spade"] += 0.5;
                        }
                    }
                    if (c.suit == "Joker") //obviously a trump for any suit
                    {
                        trumpCount["Spade"]++;
                        trumpCount["Club"]++;
                        trumpCount["Diamond"]++;
                        trumpCount["Heart"]++;
                    }
                }
                WriteDebug("Trump Count: " + trumpCount["Spade"].ToString() + "S, " + trumpCount["Club"].ToString() + "C, " + trumpCount["Diamond"].ToString() + "D, " + trumpCount["Heart"].ToString() + "H, ");

                //get max suit
                int bidCount = 10;
                string maxSuit = "";
                while (maxSuit == "")
                {
                    if (trumpCount["Heart"] >= bidCount)
                    {
                        maxSuit = "Heart";
                    }
                    else if (trumpCount["Diamond"] >= bidCount)
                    {
                        maxSuit = "Diamond";
                    }
                    else if (trumpCount["Club"] >= bidCount)
                    {
                        maxSuit = "Club";
                    }
                    else if (trumpCount["Spade"] >= bidCount)
                    {
                        maxSuit = "Spade";
                    }
                    else
                    {
                        bidCount--;
                    }
                }

                //get max bid
                int maxBid = 0;
                switch (bidCount)
                {
                    case 1:  maxBid = -1; break;
                    case 2:  maxBid = -1; break;
                    case 3:  maxBid = -1; break;
                    case 4:  maxBid =  6; break;
                    case 5:  maxBid =  6; break;
                    case 6:  maxBid =  6; break;
                    case 7:  maxBid =  7; break;
                    case 8:  maxBid =  7; break;
                    case 9:  maxBid =  8; break;
                    case 10: maxBid =  8; break;
                    default: maxBid = -1; break;
                }

                WriteDebug("Max Bid: " + maxBid.ToString() + " " + maxSuit);

                //bid or pass
                bidAmount = 0;
                bidSuit = "pass";
                if (maxBid > -1)
                {
                    //if no other bids in play, make minimum bid of 6
                    if (topBid < 6)
                    {
                        bidAmount = 6;
                        bidSuit = maxSuit;
                    }
                    else
                    {
                        //check if able to beat top bid by suit, ie 6h > 6c
                        if (topBid <= maxBid)
                        {
                            if (suitVal[maxSuit] > suitVal[topSuit])
                            {
                                bidAmount = topBid;
                                bidSuit = maxSuit;
                            }
                            else
                            {
                                //suit cant beat it, check if able to go up in bid amount
                                if ((topBid + 1) <= maxBid)
                                {
                                    bidAmount = topBid + 1;
                                    bidSuit = maxSuit;
                                }
                            }
                        }
                    }
                }
                Console.WriteLine("Bid: " + bidAmount.ToString() + " " + bidSuit);
                
                return bidAmount.ToString() + " " + bidSuit;
            }

            public void PlayCard(Game g, GameRound thisRound, Trick thisTrick)
            {
                Console.WriteLine("\r\nPlayer " + id.ToString() + " is thinking...");

                SortHand();

                string  playThis    = "";
                string  playStatus  = "";
                int     checkVal    =  0;
                string  checkSuit   = "";

                if (ai != "Human")
                {
                    //handle AI - first, analyze the round
                    string wd = "";
                    foreach (string c in thisTrick.playedThisTrick)
                    {
                        wd += c + ", ";
                    }
                    WriteDebug("Cards currently in play: "+wd);
                    WriteDebug("Top remaining in suits: " + thisRound.topInSuit["Spade"] + " " + thisRound.topInSuit["Club"] + " " + thisRound.topInSuit["Diamond"] + " " + thisRound.topInSuit["Heart"]);
                    WriteDebug("Remaining in hand: " + ShowHand());

                    //do I have partners?
                    int myTeam1 = -1;
                    int myTeam2 = -1;
                    if (id == thisRound.chief)
                    {
                        myTeam1 = thisRound.vice1;
                        if (thisRound.vice2 > -1) { myTeam2 = thisRound.vice2; }
                    }
                    else if (id == thisRound.vice1)
                    {
                        myTeam1 = thisRound.chief;
                        if (thisRound.vice2 > -1) { myTeam2 = thisRound.vice2; }
                    }
                    else if (id == thisRound.vice2)
                    {
                        myTeam1 = thisRound.chief;
                        myTeam2 = thisRound.vice1;
                    }

                    //choose a card to play

                    //do I start the trick?
                    if (thisTrick.leadSuit == "")
                    {
                        //yes, I start. do i have the top card in a nontrump suit?
                        WriteDebug("I lead the trick");
                        foreach (string s in thisRound.topInSuit.Keys)
                        {
                            if (s != thisRound.trumpSuit && playThis == "")
                            {
                                if (CardInHand(thisRound.topInSuit[s]))
                                {
                                    //I have highest in a nontrump suit. Is anyone known to be out of this suit?
                                    WriteDebug("I have the highest " + s);

                                    //if no oppenents are out, play the top card in this suit
                                    if (thisRound.FoeCanTrump(s, g.players, id, myTeam1, myTeam2) == false)
                                    {
                                        WriteDebug("No opponents are known to be out of this suit.");
                                        playThis = thisRound.topInSuit[s];
                                    }
                                    else
                                    {
                                        //an opponent is out of this suit. the other not trump suits will be checked.
                                        //(nothing needs to be done here, simply stating the logic flow)
                                        WriteDebug("An opponent is known to be out of this suit.");
                                    }
                                }
                            }
                        }

                        //all nontrump suits have been checked. if I havn't picked a card, continue thinking
                        if (playThis == "")
                        {
                            //I don't have the highest in any nontrump suit. Do I have the highest in trump suit?
                            WriteDebug("I don't have the highest in any nontrump suit.");

                            if (CardInHand(thisRound.topInSuit[thisRound.trumpSuit]))
                            {
                                //I have highest trump, play it.
                                WriteDebug("I have highest trump");
                                playThis = thisRound.topInSuit[thisRound.trumpSuit];
                            }
                            else
                            {
                                //I dont have highest trump, do I have any trumps?
                                WriteDebug("I don't have highest trump");
                                if (SuitInHand(thisRound.trumpSuit))
                                {
                                    //I have a trump. Play the lowest value card of the nontrump suit with least count. (we want to open up trump usage.)
                                    WriteDebug("I have a trump, play lowest value in nontrump suit of least count");
                                    playThis = GetCard("lowest", "least", thisRound.trumpSuit);
                                }
                                else
                                {
                                    //I dont have any trumps. play the lowest value card of the suit with most count. (we want to save highest value cards for future tricks)
                                    WriteDebug("I don't have a trump, play lowest value in nontrump suit of most count");
                                    playThis = GetCard("lowest", "most", thisRound.trumpSuit);
                                }
                            }
                        }
                    }
                    else
                    {
                        //another player lead the trick. do I have any of the leading suit?
                        WriteDebug("Trick is in progress.");

                        if (SuitInHand(thisTrick.leadSuit))
                        {
                            //I have the lead suit, do I have partners?
                            if (myTeam1 > -1)
                            {
                                //I have at least 1 partner. Do I play last in the trick?
                                if (id == WrapValue(0, 4, thisTrick.leadPlayer - 1))
                                {
                                    //I play last, is a partner currently winning the trick?
                                    if (thisTrick.topPlayer == myTeam1 || thisTrick.topPlayer == myTeam2)
                                    {
                                        //a partner currently holds the trick. play lowest of leading suit. 
                                        //(we want to throw under and let partner take the trick, save our high cards in suit for later tricks)
                                        WriteDebug("Partner has trick, throw under.");
                                        playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                    }
                                    else
                                    {
                                        //an opponent currently holds the trick. has a trump been thrown?
                                        WriteDebug("Opponent has trick");
                                        if (thisTrick.TrumpInPlay(thisRound.trumpSuit))
                                        {
                                            //Trump was thrown, play lowest of leading suit
                                            WriteDebug("Trump was thrown, I have to throw under.");
                                            playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                        }
                                        else
                                        {
                                            //no trump thrown. Do I have a value in lead suit higher than current top value?
                                            bool canTakeIt = false;
                                            foreach (Card c in hand)
                                            {
                                                if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                {
                                                    //I can take the trick, play this card.
                                                    WriteDebug("I can take the trick");
                                                    canTakeIt = true;
                                                    playThis = c.ToString();
                                                }
                                            }
                                            if (canTakeIt == false)
                                            {
                                                //I can't take the trick. play lowest value card of lead suit
                                                WriteDebug("I can't take the trick, throw under.");
                                                playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    //I'm not last. Have any of my partners played yet?
                                    WriteDebug("Others will play after me");

                                    int teamPlayed = 0;
                                    if (thisTrick.playedThisTrick[myTeam1] != "")
                                    {
                                        WriteDebug("Teammate 1 has played");
                                        teamPlayed++;
                                    }
                                    if (myTeam2 > -1)
                                    {
                                        if (thisTrick.playedThisTrick[myTeam2] != "")
                                        {
                                            WriteDebug("Teammate 2 has played");
                                            teamPlayed++;
                                        }
                                    }
                                    if (teamPlayed > 0)
                                    {
                                        //at least one partner has played. Do they currently hold the trick?
                                        WriteDebug("At least 1 partner has already played.");
                                        if (thisTrick.topPlayer == myTeam1 || thisTrick.topPlayer == myTeam2)
                                        {
                                            //a partner holds the trick
                                            WriteDebug("A partner holds the trick.");
                                            if (ai == "Easy")
                                            {
                                                //simple logic: play lowest of lead suit (let partner hold the trick and save high cards for later tricks)
                                                WriteDebug("throw under");
                                                playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                            }
                                            else
                                            {
                                                //complex logic: is anyone after me known to be out of the lead suit?
                                                if (thisRound.FoeCanTrump(thisTrick.leadSuit, g.players, id, myTeam1, myTeam2) == true)
                                                {
                                                    //an opponent is out of lead suit, may be able to throw a trump. play lowest card of lead suit.
                                                    WriteDebug("Opponent might through trump. throw under");
                                                    playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                }
                                                else
                                                {
                                                    //no oponents are out of lead suit. has a partner played the top card in the lead suit?
                                                    // ***** top in suit will be updated at the end of the trick. if someone has played the top in suit, it will match with thier played to trick. ***
                                                    bool topInPlay = false;
                                                    for (int p = 0; p < 5; p++)
                                                    {
                                                        string c = thisTrick.playedThisTrick[p];
                                                        if (c == thisRound.topInSuit[thisTrick.leadSuit])
                                                        {
                                                            topInPlay = true;
                                                        }
                                                    }
                                                    if (topInPlay == true)
                                                    {
                                                        //someone played the top card in the lead suit. I have to throw under. play lowest card of lead suit.
                                                        WriteDebug("Someone played top of lead suit, throw under");
                                                        playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                    }
                                                    else
                                                    {
                                                        //top in lead suit has not yet been played. Do I have it?
                                                        WriteDebug("Top card in lead suit has not yet been played.");
                                                        foreach (Card c in hand)
                                                        {
                                                            if (c.ToString() == thisRound.topInSuit[thisTrick.leadSuit])
                                                            {
                                                                //I have the top card in the lead suit. Has a partner played the next highest down?
                                                                WriteDebug("I have the top card in the lead suit.");
                                                                //int nextDown = c.value - 1;
                                                                if (Array.IndexOf(thisTrick.playedThisTrick, c.GetNextCard(-1)) > -1)
                                                                {
                                                                    //partner played next card down, they have the trick, throw under and save top in suit for a later trick
                                                                    WriteDebug("Partner has next highest down, throw under.");
                                                                    playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                                }
                                                                else
                                                                {
                                                                    //partner could be beat. throw top card in suit
                                                                    WriteDebug("Partner could be beaten, play top in suit");
                                                                    playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                                }
                                                            }
                                                            else
                                                            {
                                                                //I don't have have the highest in lead suit, and highest has not yet been played. play lowest card of lead suit. 
                                                                //(save high cards, as anything we throw will likely be beaten when top card probably will come out later in this trick)
                                                                WriteDebug("I don't have top in suit, throw under.");
                                                                playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        else
                                        {
                                            //opponent holds the trick
                                            WriteDebug("Opponent holds the trick");

                                            if (ai == "Easy")
                                            {
                                                //simple logic: Do I have a card higher than the current top card?
                                                bool canTake = false;
                                                foreach (Card c in hand)
                                                {
                                                    if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                    {
                                                        //I can hold the trick, and might take it. play highest card of this leading suit.
                                                        WriteDebug("I might take the trick");
                                                        canTake = true;
                                                        playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                    }
                                                }
                                                if (canTake == false)
                                                {
                                                    //can't take the trick, throw under
                                                    WriteDebug("I can't take the trick, have to throw under.");
                                                    playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                }
                                            }
                                            else
                                            {
                                                //complex logic: Do I have the top card in the lead suit?
                                                if (CardInHand(thisRound.topInSuit[thisTrick.leadSuit]))
                                                {
                                                    //I have the highest. Is anyone after me known to be out of this suit?
                                                    WriteDebug("I have top card in leading suit.");
                                                    if (thisRound.FoeCanTrump(thisTrick.leadSuit, g.players, id, myTeam1, myTeam2) == true)
                                                    {
                                                        //an opponent is out of lead suit, may be able to throw a trump. play a card high enough to hold the trick, but save the top in suit if possible.
                                                        WriteDebug("Opponent might through trump. hold the trick but save top in suit if possible");
                                                        foreach (Card c in hand)
                                                        {
                                                            if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                            {
                                                                playThis = c.ToString();
                                                            }
                                                        }
                                                    }
                                                    else
                                                    {
                                                        //no one is known out, throw highest of lead suit.
                                                        WriteDebug("No opponents are known to be out of lead suit. Throw top in suit.");
                                                        playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                    }
                                                }
                                                else
                                                {
                                                    //I don't have the highest and might be beat. throw under.
                                                    WriteDebug("I don't have the highest of this suit. Throw lowest of lead suit.");
                                                    playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        //No one on my team has played yet.
                                        WriteDebug("No one on my team has played yet.");

                                        if (ai == "Easy")
                                        {
                                            //simple logic: Do I have a card higher than the current top card?
                                            bool canTake = false;
                                            foreach (Card c in hand)
                                            {
                                                if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                {
                                                    //I can hold the trick, and might take it. play highest card of this leading suit.
                                                    WriteDebug("I might take the trick");
                                                    canTake = true;
                                                    playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                }
                                            }
                                            if (canTake == false)
                                            {
                                                //can't take the trick, throw under
                                                WriteDebug("I can't take the trick, have to throw under.");
                                                playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                            }
                                        }
                                        else
                                        {
                                            //complex logic: has top in lead suit been played?
                                            if (thisTrick.TopInPlay(thisRound.topInSuit[thisTrick.leadSuit]))
                                            {
                                                //An opponent has played the top card in the lead suit. must throw under."
                                                WriteDebug("An opponent played the top card in lead suit, I must throw under.");
                                                playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                            }
                                            else
                                            {
                                                //No one has played top in suit yet, do I have it?
                                                if (CardInHand(thisRound.topInSuit[thisTrick.leadSuit]))
                                                {
                                                    //I have the highest. Is anyone after me known to be out of this suit?
                                                    WriteDebug("I have top card in leading suit.");
                                                    if (thisRound.FoeCanTrump(thisTrick.leadSuit, g.players, id, myTeam1, myTeam2) == true)
                                                    {
                                                        //an opponent is out of lead suit, may be able to throw a trump. play a card high enough to hold the trick, but save the top in suit if possible.
                                                        WriteDebug("Opponent might through trump. hold the trick but save top in suit if possible");
                                                        foreach (Card c in hand)
                                                        {
                                                            if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                            {
                                                                playThis = c.ToString();
                                                            }
                                                        }
                                                    }
                                                    else
                                                    {
                                                        //no one is known out, throw highest of lead suit.
                                                        WriteDebug("No opponents are known to be out of lead suit. Throw top in suit.");
                                                        playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                    }
                                                }
                                                else
                                                {
                                                    //I don't have the highest and might be beat. throw under.
                                                    WriteDebug("I don't have the highest of this suit. Throw lowest of lead suit.");
                                                    playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else
                            {
                                //I have no partners
                                WriteDebug("I don't have partners.");

                                if (ai == "Easy")
                                {
                                    //simple logic: Do I have a card higher than the current top card?
                                    bool canTake = false;
                                    foreach (Card c in hand)
                                    {
                                        if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                        {
                                            //I can hold the trick, and might take it. play highest card of this leading suit.
                                            WriteDebug("I might take the trick");
                                            canTake = true;
                                            playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                        }
                                    }
                                    if (canTake == false)
                                    {
                                        //can't take the trick, throw under
                                        WriteDebug("I can't take the trick, have to throw under.");
                                        playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                    }
                                }
                                else
                                {
                                    //complex logic: has top in lead suit been played?
                                    if (thisTrick.TopInPlay(thisRound.topInSuit[thisTrick.leadSuit]))
                                    {
                                        //An opponent has played the top card in the lead suit. must throw under."
                                        WriteDebug("An opponent played the top card in lead suit, I must throw under.");
                                        playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                    }
                                    else
                                    {
                                        //No one has played top in suit yet, do I have it?
                                        if (CardInHand(thisRound.topInSuit[thisTrick.leadSuit]))
                                        {
                                            //I have the highest. Is anyone after me known to be out of this suit?
                                            WriteDebug("I have top card in leading suit.");
                                            if (thisRound.FoeCanTrump(thisTrick.leadSuit, g.players, id, myTeam1, myTeam2) == true)
                                            {
                                                //an opponent is out of lead suit, may be able to throw a trump. play a card high enough to hold the trick, but save the top in suit if possible.
                                                WriteDebug("Opponent might through trump. hold the trick but save top in suit if possible");
                                                foreach (Card c in hand)
                                                {
                                                    if (c.suit == thisTrick.leadSuit && c.value > thisTrick.topValue)
                                                    {
                                                        playThis = c.ToString();
                                                    }
                                                }
                                            }
                                            else
                                            {
                                                //no one is known out, throw highest of lead suit.
                                                WriteDebug("No opponents are known to be out of lead suit. Throw top in suit.");
                                                playThis = GetCard("highest", thisTrick.leadSuit, thisRound.trumpSuit);
                                            }
                                        }
                                        else
                                        {
                                            //I don't have the highest and might be beat. throw under.
                                            WriteDebug("I don't have the highest of this suit. Throw lowest of lead suit.");
                                            playThis = GetCard("lowest", thisTrick.leadSuit, thisRound.trumpSuit);
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            //I don't have any of the lead suit, I can use trumps and offsuits. Do I have any trumps?
                            WriteDebug("I am out of the leading suit.");

                            if (SuitInHand(thisRound.trumpSuit))
                            {
                                //I have a trump, do I have partners?
                                WriteDebug("I have a trump.");

                                //************** incomplete

                                //temp simpler logic to keep things moving:
                                if (thisTrick.TrumpInPlay(thisRound.trumpSuit))
                                {
                                    //Do I have a trump higher than the current highest trump in play?
                                    bool canTake = false;
                                    foreach (Card c in hand)
                                    {
                                        if (c.suit == thisRound.trumpSuit && c.value > thisTrick.topValue)
                                        {
                                            //I can hold the trick, and might take it. play highest card of trump suit.
                                            WriteDebug("I might take the trick");
                                            canTake = true;
                                            playThis = GetCard("highest", thisRound.trumpSuit, thisRound.trumpSuit);
                                        }
                                    }
                                    if (canTake == false)
                                    {
                                        //can't take the trick, throw under with offsuit of least count
                                        WriteDebug("I can't take the trick, throw lowest value of suit with least count.");
                                        playThis = GetCard("lowest", "least", thisRound.trumpSuit);
                                    }
                                }
                                else
                                {
                                    //no other trumps in play, I can hold the trick with any trump, throw the lowest.   
                                    playThis = GetCard("lowest", thisRound.trumpSuit, thisRound.trumpSuit);
                                }
                            }
                            else
                            {
                                //I have no trumps, must throw an offsuit. pick lowest value card of suit with least count
                                WriteDebug("I can't take the trick, throw lowest value of suit with least count.");
                                playThis = GetCard("lowest", "least", thisRound.trumpSuit);
                            }
                        }
                    }
                }
                else
                {
                    //let player choose a card
                    bool cardIsValid = false;
                    while (cardIsValid == false)
                    {
                        string wd3 = "";
                        int i = 0;
                        foreach (string c in thisTrick.playedThisTrick)
                        {
                            wd3 += "\r\np" + i.ToString() + ": " + c;
                            i++;
                        }
                        Console.WriteLine("Cards in play: " + wd3);
                        Console.WriteLine("Lead Suit: " + thisTrick.leadSuit);
                        Console.WriteLine("Trump Suit: " + thisRound.trumpSuit);
                        Console.WriteLine("\r\nYour hand: " + ShowHand());
                        Console.Write("Choose a card to play >> ");

                        playThis = Console.ReadLine().ToUpper();

                        //evaluate chosen card
                        for (int c = 0; c < hand.Count; c++)
                        {
                            if (hand[c].ToString() == playThis)
                            {
                                checkVal = hand[c].value;
                                checkSuit = hand[c].suit;
                            }
                        }

                        //check that card is actually in the hand
                        if (CardInHand(playThis) == true)
                        {
                            //check that suit is allowable
                            if (checkSuit == thisTrick.leadSuit)
                            {
                                //played to lead suit, good to go.
                                cardIsValid = true;
                            }
                            else
                            {
                                //chose trump or offsuit, am I out of lead suit?
                                if (SuitInHand(thisTrick.leadSuit) == false)
                                {
                                    //have no lead suit, good to go.
                                    cardIsValid = true;
                                }
                                else
                                {
                                    //still have lead suit, must play to lead.
                                    Console.WriteLine(PrintLine("!"));
                                    Console.WriteLine("You must play from the leading suit if you have any cards of that suit.\r\n");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine(PrintLine("!"));
                            Console.WriteLine("Specified card is not found in your hand.\r\n");
                        }
                    }
                }

                //card has been chosen, manage updates
                Console.WriteLine("Player chose to play " + playThis);
                if (playThis == "")
                {
                    Console.WriteLine(PrintLine("!"));
                    WriteDebug("error: playThis is still blank, ai logic fault");
                    Console.ReadKey();
                }

                //calculate status
                if (ai != "Human")
                {
                    //evaluate chosen card
                    for (int c = 0; c < hand.Count; c++)
                    {
                        if (hand[c].ToString() == playThis)
                        {
                            checkVal = hand[c].value;
                            checkSuit = hand[c].suit;
                        }
                    }
                }

                playStatus = "throw under";
                WriteDebug("I played value " + checkVal.ToString() + " of suit " + checkSuit);
                //is a trump in play?
                if (thisTrick.TrumpInPlay(thisRound.trumpSuit) == true)
                {
                    WriteDebug("Trump is in play");
                    //Did I throw a trump?
                    if (checkSuit == thisRound.trumpSuit)
                    {
                        WriteDebug("I threw a trump");
                        //do I have top in trump?
                        if (checkVal >= thisTrick.topValue)
                        {
                            WriteDebug("my trump wins, i am new on top");
                            playStatus = "new on top";
                        }
                        else
                        {
                            WriteDebug("my trump was beaten");
                            playStatus = "throw under";
                        }
                    }
                    else
                    {
                        WriteDebug("I was trumped");
                        playStatus = "throw under";
                    }

                }
                else
                {
                    //did I start the trick?
                    if (thisTrick.leadSuit == "")
                    {
                        WriteDebug("I lead the trick, i am new on top");
                        playStatus = "new on top";
                    }
                    else
                    {
                        //did I play in the lead suit?
                        if (checkSuit == thisTrick.leadSuit)
                        {
                            WriteDebug("I played in lead suit, no trumps in play");
                            //do I have top in lead suit?
                            if (checkVal >= thisTrick.topValue)
                            {
                                WriteDebug("I have highest in trick, i am new on top");
                                playStatus = "new on top";
                            }
                            else
                            {
                                WriteDebug("I was beaten");
                                playStatus = "throw under";
                            }
                        }
                        else if (checkSuit == thisRound.trumpSuit)
                        {
                            WriteDebug("I threw a trump, no other trumps in play, i am new on top");
                            playStatus = "new on top";
                        }
                        else
                        {
                            WriteDebug("I played a non-trump off-suit");
                            playStatus = "throw under";
                        }
                    }
                }

                //locate card in hand
                Card playCard = hand[0];
                int cardIndex = 0;
                for (int c = 0;c < hand.Count;c++)
                {
                    if (hand[c].ToString() == playThis)
                    {
                        playCard = hand[c];
                        cardIndex = c;
                        WriteDebug("card located in hand at index " + cardIndex.ToString());
                    }
                }

                //play card to trick
                thisTrick.playedThisTrick[id] = playThis;
                WriteDebug(playCard.ToString() + " played to trick");
                string wd2 = "";
                foreach(string c in thisTrick.playedThisTrick)
                {
                    wd2 += c + ", ";
                }
                WriteDebug("Cards now in play: "+wd2);

                //handle top status
                if (playStatus == "new on top")
                {
                    thisTrick.topPlayer = id;
                    thisTrick.topSuit = playCard.suit;
                    thisTrick.topValue = playCard.value;
                    Console.WriteLine("Player " + id.ToString() + " now holds the trick.");
                }

                //handle lead suit
                if (thisTrick.leadSuit == "")
                {
                    thisTrick.leadSuit = playCard.suit;
                    Console.WriteLine("Lead suit is now " + thisTrick.leadSuit);
                }

                //handle top in suit
                if (playCard.ToString() == thisRound.topInSuit[playCard.suit])
                {
                    thisRound.topInSuit[playCard.suit] = playCard.GetNextCard(-1);
                    WriteDebug("New top " + playCard.suit + " is " + thisRound.topInSuit[playCard.suit]);
                }

                //handle out of suit
                if (playCard.suit != thisTrick.leadSuit)
                {
                    thisRound.outOfSuit[thisTrick.leadSuit].SetValue(true, id);

                }

                //remove card from hand
                hand.RemoveAt(cardIndex);
                WriteDebug("Player " + id.ToString() + "'s hand is now: " + ShowHand()+"\r\n"); 
            }

            public bool CardInHand(string n)
            {
                foreach (Card c in hand)
                {
                    if (c.ToString() == n)
                    {
                        return true;
                    }
                }
                return false;
            }

            public bool SuitInHand(string n)
            {
                foreach (Card c in hand)
                {
                    if (c.suit == n)
                    {
                        return true;
                    }
                }
                return false;
            }

            public string GetCard(string direction, string suit, string trump)
            {
                WriteDebug("Getting card: " + direction + " in " + suit);

                //ensure our count and sort is current
                GetSuitCount();

                if (direction == "lowest")
                {
                    if (suit == "least")
                    {
                        //find lowest value card in nontrump suit of least count
                        foreach (string s in suitCount.Keys)
                        {
                            foreach (Card c in hand)
                            {
                                if (c.suit == s && c.suit != trump)
                                {
                                    return c.ToString();
                                }
                            }
                        }
                        //if not returned, only have trumps. get lowest (hand having been sorted, it will be first card in hand)
                        return hand[0].ToString();
                    }
                    else if (suit == "most")
                    {
                        //find lowest value card in nontrump suit of most count
                        foreach(string s in suitCount.Keys.Reverse<string>())
                        {
                            foreach (Card c in hand)
                            {
                                if (c.suit == s && c.suit != trump)
                                {
                                    return c.ToString();
                                }
                            }
                        }
                        //if not returned, only have trumps. get lowest (hand having been sorted, it will be first card in hand)
                        return hand[0].ToString();
                    }
                    else
                    {
                        //find lowest value card in specific suit
                        foreach (Card c in hand)
                        {
                            if (c.suit == suit)
                            {
                                return c.ToString();
                            }
                        }
                    }
                }
                else
                {
                    if (suit == "least")
                    {
                        //find highest value card in nontrump suit of least count
                        foreach (Card c in hand.Reverse<Card>())
                        {
                            foreach (string s in suitCount.Keys)
                            {
                                if (c.suit == s && c.suit != trump)
                                {
                                    return c.ToString();
                                }
                            }
                        }
                        //if not returned, only have trumps. get highest (hand having been sorted, it will be last card in hand)
                        return hand[hand.Count].ToString();
                    }
                    else if (suit == "most")
                    {
                        //find highest value card in nontrump suit of most count
                        foreach (string s in suitCount.Keys.Reverse<string>())
                        {
                            foreach (Card c in hand.Reverse<Card>())
                            {
                                if (c.suit == s && c.suit != trump)
                                {
                                    return c.ToString();
                                }
                            }
                        }
                        //if not returned, only have trumps. get highest (hand having been sorted, it will be last card in hand)
                        return hand[hand.Count].ToString();
                    }
                    else
                    {
                        //find highest value card in specific suit
                        foreach (Card c in hand.Reverse<Card>())
                        {
                            if (c.suit == suit)
                            {
                                return c.ToString();
                            }
                        }
                    }
                }
                return "error, you should have returned by now.";
            }
        }

        //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------

        //Define suit hierarchy
        public static Dictionary<string, int> suitVal = new Dictionary<string, int>()
        {
            {"Spade",   1},
            {"Club",    2},
            {"Diamond", 3},
            {"Heart",   4},
            {"Joker",   5}
        };

        public static int GetListKeyValueIndex<T>(List<KeyValuePair<string, T>> hay, string needle)
        {
            int index = 0;
            for (int i = 0; i < hay.Count(); i++)
            {
                if (hay[i].Key == needle)
                {
                    index = i;
                }
            }
            return index;
        }

        public static int WrapValue(int minVal, int maxVal, int newVal)
        {
            while(newVal > maxVal)
            {
                newVal = newVal - maxVal - 1;
            }
            while (newVal < minVal)
            {
                newVal = maxVal + newVal + 1;
            }
            return newVal;
        }


        public static string ToUpperFirst(string s)
        {
            if (string.IsNullOrEmpty(s))
            {
                return string.Empty;
            }
            return char.ToUpper(s[0]) + s.Substring(1);
        }

        static void WriteDebug(string s)
        {
            if (Game.debugMode == "true")
            {
                Console.WriteLine(s);
            }
        }

        static string PrintLine(string s)
        {
            string line = "";
            for (int i = 0; i < 79; i++)
            {
                line += s;
            }
            return line;
        }

        static void Main(string[] args)
        {
            //eval cmd line
            string difficulty = "Default (Easy)";
            string debug = "false";
            foreach (string a in args)
            {
                if (a.Length > 4)
                {
                    if (a.Substring(0, 5) == "mode:")
                    {
                        difficulty = a.Substring(5);
                    }
                }
                if(a.Length > 6)
                {
                    if (a.Substring(0, 6) == "debug:")
                    {
                        debug = a.Substring(6);
                    }
                }
            }

            Console.WriteLine(PrintLine("="));
            Console.WriteLine("                        - Five Hundred for Five Players -");
            Console.WriteLine(PrintLine("="));

            Game thisGame = new Game(difficulty, debug);

            Console.ReadKey();
        }
    }
}
