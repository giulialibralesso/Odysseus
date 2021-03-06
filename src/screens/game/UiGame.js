import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";


//Styles
import './UiGame.css';

//Components
import Odysseus from "../../components/funcComponents/ui/odysseus/Odysseus";
import UiModal from "../../components/funcComponents/ui/uiModal/UiModal";
import UiButton from "../../components/funcComponents/ui/uiButton/UiButton";
import Obstacle from "../../components/funcComponents/ui/obstacle/Obstacle";

//utils
import { randomIntFromInterval, getRandomIcon, setUser } from '../../utils/utils';


function UiGame() {

   const GRAVITY = 5;
   const JUMP = 100;
   const OBSTACLE_MOVEMENT = 5;
   const CLOUDS_HEIGHT = Math.floor(window.innerHeight * 0.25);
   const KRAKEN_HEIGHT = Math.floor(window.innerHeight - (window.innerHeight * 0.25));
   const navigate = useNavigate();
   const location = useLocation();
   const currentUser = location.state?.currentUser;
   const GAME_MILLISECONDS = 100;

   let localStoragePlayers = JSON.parse(localStorage.getItem('players'));
   let players = localStoragePlayers ? [...localStoragePlayers] : [];


   const [state, setState] = useState({
      isPlaying: false,
      score: 0,
      scoreString: '',
      showModal: false,
      lastScoreString: '',
      gameStartAudio: new Audio(require('../../assets/sounds/game_start_audio.mp3')),
      gameOverAudio: new Audio(require('../../assets/sounds/game_over_audio.wav')),
      soundOn: true,
      odysseus: {
         x: 200,
         y: 300,
         width: 0,
         height: 0
      },
      obstacle: {
         active: false,
         x: 0,
         y: 0,
         width: 0,
         height: 0,
         icon: ''
      }
   });


   //Avatar
   useEffect(() => {

      state.soundOn ? state.gameStartAudio.play() : state.gameStartAudio.pause();

      const schedulerGravity = setTimeout(() => {
         let newOdysseus = state.odysseus;
         let newIsPlaying = state.isPlaying;
         let newShowModal = state.showModal;
         let newObstacle = state.obstacle;
         let obstacleCoords = state.obstacle;

         if (state.isPlaying) {
            // simula la gravit??
            newOdysseus.y = newOdysseus.y + GRAVITY;

            //Controllo se l'ostacolo ?? gi?? attivo
            if (!newObstacle.active) {

               //Se non lo ??, lo attivo e gli assegno le coordinate x e y (y randomica)
               newObstacle = generateNewObstacle();
            } else {
               obstacleCoords = document.querySelector('.obstacle img').getBoundingClientRect();
            }
            //Aggiorno la sua posizione sulla x
            newObstacle.x = newObstacle.x - OBSTACLE_MOVEMENT;

            //Controllo se c'?? stata una collisione
            let odysseusCoords = document.querySelector('.odysseus img').getBoundingClientRect();
            let collision = detectCollision(odysseusCoords, obstacleCoords);

            //Caso di game over
            if ((odysseusCoords.y < CLOUDS_HEIGHT) || (odysseusCoords.y + odysseusCoords.height > KRAKEN_HEIGHT) || collision) {

               state.gameOverAudio.play();

               // prima di resettare tutto salviamo per la classifica
               players.push({
                  name: currentUser,
                  score: state.score
               })
               localStorage.setItem('players', JSON.stringify(players));
               newIsPlaying = false;
               newShowModal = true;
            }
            else {
               if (newObstacle.x <= -100) {
                  newObstacle.active = false;
               }
            }

         }

         setState((state) => ({
            ...state,
            odysseus: newOdysseus,
            isPlaying: newIsPlaying,
            showModal: newShowModal,
            lastScoreString: state.scoreString,
            obstacle: newObstacle,
         }));
      }, GAME_MILLISECONDS)

      return () => {
         clearTimeout(schedulerGravity);
      }

   }, [state.isPlaying, state.odysseus.y, state.soundOn]);

   //Score
   useEffect(() => {

      const schedulerScore = setTimeout(() => {

         let newScore = state.score + 1;
         let scoreDate = new Date(newScore * 1000);
         let newScoreString = `${scoreDate.getMinutes()}m ${scoreDate.getSeconds()}s`;
         setState((state) => ({
            ...state,
            score: newScore,
            scoreString: newScoreString
         }));

      }, 1000)

      return () => {
         clearTimeout(schedulerScore);
      }
   }, [state.score])


   function detectCollision(avatar, obstacle) {
      if (obstacle.x <= avatar.x + avatar.width &&
         obstacle.x + obstacle.width >= avatar.x &&
         obstacle.y <= avatar.y + avatar.height &&
         obstacle.height + obstacle.y >= avatar.y) {
         return true;
      } else {
         return false;
      }
   }

   function goToRanking() {
      setUser(currentUser, navigate, '/ranking');
   }

   const generateNewObstacle = () => {
      let positionX = window.innerWidth + 50;
      let randomPositionY = randomIntFromInterval(CLOUDS_HEIGHT, KRAKEN_HEIGHT - 70);
      let obstacle = {
         active: true,
         x: positionX,
         y: randomPositionY,
         width: 0,
         height: 0,
         icon: getRandomIcon()
      };
      return obstacle;
   }

   function setOdysseusSize(width, height, x) {
      let newOdysseus = state.odysseus;
      newOdysseus.width = width;
      newOdysseus.height = height;
      newOdysseus.x = x;
      setState({
         ...state,
         odysseus: newOdysseus
      });
   }

   function setObstacleSize(width, height) {

      let newObstacle = state.obstacle;
      newObstacle.width = width;
      newObstacle.height = height;
      setState({
         ...state,
         obstacle: newObstacle
      });
   }

   function jump() {

      let newOdysseus = state.odysseus;
      newOdysseus.y = newOdysseus.y - JUMP;

      setState({
         ...state,
         odysseus: newOdysseus
      });

   }

   function handleStartGame() {

      let startObstaclePositionObject = generateNewObstacle();

      setState({
         ...state,
         isPlaying: true,
         odysseus: {
            x: 200,
            y: 300,
            width: 0,
            height: 0
         },
         showModal: false,
         soundOn: false,
         score: 0,
         obstacle: startObstaclePositionObject
      })
   }

   function handleGoBackToMenu() {
      navigate('/', {
         state: {
            currentUser: currentUser
         }
      });
      setState({
         ...state,
         soundOn: false
      })
   }


   //RENDER
   if (currentUser === undefined) {
      return <Navigate to='/' />;
   } else {
      return (
         <>
            {
               state.showModal &&
               <UiModal
                  onButtonClick={handleGoBackToMenu}
                  onClose={handleStartGame}
                  buttonLabel={'Exit game'}
               >
                  <p>Game over</p>
                  <p>{state.lastScoreString}</p>
                  <UiButton
                     callback={goToRanking}
                     label={'See ranking'}
                     buttonClass={'button rankingGameBtn'}
                  />
               </UiModal>
            }

            {
               !state.isPlaying &&
               <div className="wanna-play-container">

                  <UiButton
                     callback={handleStartGame}
                     label={'Start Game'}
                  />
               </div>
            }

            {
               state.isPlaying &&
               <div className="game-container" onClick={jump}>
                  <div className="parallax middleground"></div>
                  <div className="parallax foreground"></div>
                  <div className="score-label">
                     {state.scoreString}
                  </div>
                  <Odysseus
                     setOdysseusSize={setOdysseusSize}
                     positionX={state.odysseus.x}
                     positionY={state.odysseus.y}
                     width={state.odysseus.width}
                     height={state.odysseus.height}
                  />
                  {
                     state.obstacle.active &&
                     <Obstacle
                        setObstacleSize={setObstacleSize}
                        positionX={state.obstacle.x}
                        positionY={state.obstacle.y}
                        iconSrc={state.obstacle.icon}
                     />
                  }
               </div>
            }

         </>

      )

   }
}


export default UiGame;