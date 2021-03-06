new Vue({
    name: 'game',
    el: '#app',

    data: state,
    template: `<div id="#app" :class="cssClass">
                <top-bar :turn="turn" :current-player-index="currentPlayerIndex"
                         :players="players"/>
                <div class="world">
                <castle v-for="(player, index) in players" :player="player"
                            :index="index" :key="index" />
                <div class="land" />

                <div class="clouds">
                <cloud v-for="index in 10" :type="(index - 1) % 5 + 1"  :key="index" />
                </div>

                </div>

                <transition name="hand">
                <hand :cards="currentHand" v-if="!activeOverlay"  @card-play="handlePlayCard" 
                  @card-leave-end="handleCardLeaveEnd"/>
                </transition>

                <transition name="fade">
                     <div class="overlay-background" v-if="activeOverlay" />
                </transition>

                <transition name="zoom">
                <overlay v-if="activeOverlay" :key="activeOverlay" @close="handleOverlayClose">
                    <component :is="'overlay-content-' + activeOverlay"
                               :player="currentPlayer" :opponent="currentOpponent"
                               :players="players" />
                </overlay>
                </transition>

               </div>`,

    computed: {
        testCard () {
            return cards.archers
        },
        cssClass () {
                 return {
                   'can-play': this.canPlay,
                 }
              },
            },
    methods: {

        // testPlayCard (card) {
        //     console.log('testPlayCard in main.js')
        //     const index = this.testHand.indexOf(card)
        //     this.testHand.splice(index, 1)
        // },
        handlePlayCard (card) {
          console.log('handlePlayCard')
          playCard(card)
        },
        handleOverlayClose () {
          overlayCloseHandlers[this.activeOverlay]()
        },

        handleCardLeaveEnd () {
          console.log('card leave end')
          applyCard()
        },

        testDrawCard() {

            const ids = Object.keys(cards)
            const randomId = ids[Math.floor(Math.random() * ids.length)] // Return a new card with this definition
            return {
                     // Unique id for the card
                     uid: cardUid++,
                     // Id of the definition
                     id: randomId,
                     // Definition object
                     def: cards[randomId],
                   }
        },
        // createTestHand (){
        //     // console.log('creatTestHand:', cards)
        //     const cards = []
        //     // const ids = Object.keys(cards)
        //     // console.log('ids=', ids)
        //     for (let i=0; i < 5; i++){
        //         cards.push(this.testDrawCard())
        //     }
        //     return cards
        // },

    },

    mounted () {
    beginGame()
    },
    
    created () {
        // this.testHand = this.createTestHand()

        // console.log('testHand=>', this.testHand)
    },

})

var overlayCloseHandlers = {
  'player-turn' () {
    if (state.turn > 1) {
      state.activeOverlay = 'last-play'
    } else {
      newTurn()
    }
  },

  'last-play' () {
    newTurn()
  },

  'game-over' () {
    document.location.reload()
  },
}


window.addEventListener('resize', () => {
    state.worldRatio = getWorldRatio()
})

// Tween.js
requestAnimationFrame(animate);

function animate(time) {
  requestAnimationFrame(animate);
  TWEEN.update(time);
}

// Gameplay

// state.activeOverlay = 'player-turn'

function beginGame () {
  state.players.forEach(drawInitialHand)
}

function playCard (card) {
  if (state.canPlay) {
    state.canPlay = false
    currentPlayingCard = card

    // Remove the card from player hand
    const index = state.currentPlayer.hand.indexOf(card)
    state.currentPlayer.hand.splice(index, 1)

    // Add the card to the discard pile
    addCardToPile(state.discardPile, card.id)
    console.log('playCard###')
  }
}

function applyCard () {
  const card = currentPlayingCard

  applyCardEffect(card)

  // Wait a bit for the player to see what's going on
  setTimeout(() => {
    // Check if the players are dead
    state.players.forEach(checkPlayerLost)

    if (isOnePlayerDead()) {
      endGame()
    } else {
      nextTurn()
    }
  }, 700)
}

function nextTurn () {
  state.turn ++
  state.currentPlayerIndex = state.currentOpponentId
  state.activeOverlay = 'player-turn'
}

function newTurn () {
  state.activeOverlay = null
  if (state.currentPlayer.skipTurn) {
    skipTurn()
  } else {
    startTurn()
  }
}

function skipTurn () {
  state.currentPlayer.skippedTurn = true
  state.currentPlayer.skipTurn = false
  nextTurn()
}

function startTurn () {
  state.currentPlayer.skippedTurn = false
  if (state.turn > 2) {
    // Draw new card
    setTimeout(() => {
      state.currentPlayer.hand.push(drawCard())
      state.canPlay = true
    }, 800)
  } else {
    state.canPlay = true
  }
}

function endGame () {
  state.activeOverlay = 'game-over'
}

