angular.module('tabete.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicSideMenuDelegate, $localstorage) {
  // Create the password modal that we will use later
  $ionicModal.fromTemplateUrl('templates/password.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalPassword = modal;
  });

  $scope.input = {};

  //Initialize settings - get from localstorage, create new if none exist.
  $scope.settings = $localstorage.getObject('settings');

  if (!$scope.settings.hasOwnProperty('passwordset'))
  {
    $scope.settings = {
    testmode:     false, 
    passwordset:  false,
    password:     ""
    };

    $localstorage.setObject('settings', $scope.settings);
  }

 //Slow slider down and set localstorage settings 
  $scope.toggleTestMode = function() {
        $timeout(function() {$ionicSideMenuDelegate.toggleLeft();}, 100);
        $localstorage.setObject('settings', $scope.settings);
  };
  // Triggered in the password modal to close it
  $scope.closePassword = function() {
    $scope.passworderror = "";
    $scope.modalPassword.hide();
  };

  // Open the password modal
  $scope.password = function() {
    $scope.modalPassword.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doPassword = function() {
    
    if($scope.settings.passwordset){
      if($scope.settings.password === $scope.input.password){
        $scope.settings.password = "";
        $scope.input.password = "";
        $scope.settings.passwordset = false;
        $scope.closePassword();
      }
      else {
        alert("Falsches Passwort");
      }
    }
    else {
      if ($scope.input.password === undefined || $scope.input.password === ""){
        alert("Das Password darf nicht leer sein");
      } else {
        $scope.settings.password = $scope.input.password;
        $scope.settings.passwordset = true;
        $localstorage.setObject('settings', $scope.settings);
        $scope.input.password = "";
        $scope.closePassword();
      }
    }
  };
})

.controller('StudiesCtrl', function($scope, $state, $ionicPlatform, studyServices, $ionicLoading, $ionicModal, $q, $ionicPopup, $localstorage, $cordovaBarcodeScanner, $http, dataLayer, devTest, $cordovaLocalNotification, $rootScope, $timeout) {
// DEVTEST Data
  $scope.t_studies = [
    { title: 'Zeitverwendung im Studienalltag', id: 1 },
    { title: 'Langeweile im Praktikum', id: 2 }
  ];
  //DEV Buttons
  $scope.resetDatabase = function() {
    devTest.devReset();
    $scope.updateStudies();
    console.log('Datenbank wurde zurückgesetzt');
  }

  $scope.testHttp = function() {
    devTest.testHttp();
    $scope.updateStudies();

  }

  $scope.testDataImport = function() {
    //devTest.testImport();

    studyData = null;
    studyData = {
        studyServer:  'http://tabea.dev:8080',
        studyName:    'te_stu',
        studyPassword:  'geheim', 
    }

    studyServices.importNewStudy(studyData);
    $scope.updateStudies();
  }

  $scope.testDatabaseAccess = function() {
    $scope.updateStudies();


  }

  $scope.testLocalNotification = function () {
    alert("test");


    var alarmTime = new Date();
    alarmTime.setMinutes(alarmTime.getMinutes() + 1);
    $cordovaLocalNotification.schedule({
        id: "1234",
        date: alarmTime,
        message: "This is a message",
        title: "This is a title",
        data: {
          substudy_id: 1
        }
    }).then(function () {
        console.log("The notification has been set");
    });
  }

  $rootScope.$on('$cordovaLocalNotification:trigger',
    function (event, notification, state) {
      console.log('trigger');
      console.log(event);
      console.log(notification);
      console.log(state);
      alert("A loc Not was triggered");
      $state.go('app.questiongroup', {'questiongroupId': notification.data.substudy_id});
    });

  $rootScope.$on('$cordovaLocalNotification:click',
    function (event, notification, state) {
      console.log('click');
      console.log(event);
      console.log(notification);
      console.log(state);
      alert("A loc Not was clicked");
    });

  $scope.substudies = [];
  $scope.substudies = null;
  $scope.hasSubstudies = false;
  $scope.allowSideMenu = true;
  $scope.newStudyInput = {
    studyServer:  "",
    studyName:    "",
    studyPassword: "" 
  };

  

  //Set view mode: list of substudies or info none
  $scope.checkForSubstudies = function() {
    if ($scope.substudies !== undefined && $scope.substudies !== null && $scope.substudies.length > 0) {
      return true;
    }
    else {
      return false;
    }
  }

  //Update study list
  $scope.updateStudies = function () {
    $ionicPlatform.ready(function() 
      { dataLayer.getStudiesWithSubstudies().then(function (res) {
        console.log(res);
        $scope.substudies = res;
        $scope.hasSubstudies = $scope.checkForSubstudies();
      })
    })
  };

  //Info popup: substudies
  $scope.showSubstudyInfo = function(substudyId) {
    
    dataLayer.getSubstudyInfo(substudyId).then(function (res) {
      var substudyPopup = $ionicPopup.alert({
        title: 'Studieninformationen',
        template: '<p><strong>Ihre ID:</strong> ' + res.subject_id + '</p>'+ '<p><strong>Beschreibung für ' + res.study_name + ':</strong> ' + res.study_description + '</p><p>' + res.substudy_description + '</p>'
      });
      substudyPopup;
    })
  };

  
  // Create Modal for adding new studies
  $ionicModal.fromTemplateUrl('templates/addstudy.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modalNewStudy = modal;
  });

  $scope.showNewStudy = function() {
    $scope.modalNewStudy.show();
  };

  $scope.closeNewStudy = function() {
    $scope.newStudyInput = {};
    $scope.modalNewStudy.hide();
  };

  //Add new study via QR-Code
  $scope.scanNewStudy = function () {
    studyServices.decodeStudyDataFromQrCode().then(function (decodedData) {
      $scope.newStudyInput = decodedData;
    })
  }

  //Add new study
  $scope.addNewStudy = function () {
    if ($scope.newStudyInput.studyServer != undefined && $scope.newStudyInput.studyServer != "" && $scope.newStudyInput.studyName != undefined && $scope.newStudyInput.studyName != "" && $scope.newStudyInput.studyPassword!= undefined && $scope.newStudyInput.studyPassword != "") {
          studyServices.importNewStudy($scope.newStudyInput).then(function (res) {
            $timeout(function() {
              $scope.updateStudies();
              $scope.closeNewStudy(); 
              }, 1000);
          });
    }
  }

  //Synchronize all Data on Device
  $scope.synchronizeData = function() {
    studyServices.synchronizeData().then(function (res) {
      console.log('done');
    })
  }
  
  $scope.loadSubstudy = function(substudyId) {
    var substudyData = {};
    
    // dataLayer.startSubstudy(substudyId).then(function (res) {
    // dataLayer.getQuestiongroup(res.id).then(function (res2) {
    //   // console.log("QG ID:");
    //   // console.log(res);
    //   // console.log("QG Data:");
    //   // console.log(res2);
    //   return res2.id;
    //   }).then(function (qgId) {
    //     dataLayer.getQuestionsByQuestiongroupId(qgId).then(function (questions) {
    //       console.log(questions);
    //     });
    //   })
    //   })
    dataLayer.startSubstudy(substudyId).then(function (questiongroupId) {
      console.log("Starting substudy, first questiongroup: " + questiongroupId);
      $state.go('app.questiongroup', {'questiongroupId': questiongroupId});
    })

    

    //   $state.go('app.questiongroup', {'questiongroupId': substudyId});
    // }, function (err) {
    //   console.error(err);
    // });
  }

  $scope.updateStudies();


})

.controller('QuestiongroupCtrl', function($scope, $rootScope, $ionicPlatform, $ionicHistory, $stateParams, $ionicSideMenuDelegate, dataLayer, studyServices) {
  //Disable Back Button 
  $ionicPlatform.registerBackButtonAction(function (event) {
                    event.preventDefault();
            }, 100);
  //Disable Side Menu
  $scope.$on('$ionicView.beforeEnter', function (e, data) { 
    $rootScope.enableLeftSideMenu = false;
  });
  
  $scope.$on('$ionicView.beforeLeave', function (e, data) { 
    $rootScope.enableLeftSideMenu = true;
  });  
  
  $scope.questiongroup = {};
  $scope.questions = [];

  // $scope.questiongroup = question_group;
  // $scope.questions = questions;

  console.log("Starting questiongroup: " + $stateParams.questiongroupId);

  studyServices.getQuestiongroup($stateParams.questiongroupId).then(function (res) {
    $scope.questiongroup = res;
    // console.log($scope.questiongroup);
    return res.id;
  }).then(function (qgId) {
    return studyServices.getQuestionsByQuestiongroupId(qgId);
  }).then(function (qs) {
    if ($scope.questiongroup.randomorder) {
      qs = studyServices.shuffleArray(qs);  
    }
    $scope.questions = qs;
    console.log($scope.questions);
  }).catch(function (err) {
    console.error(err);
  })

  $scope.moodmapValueChanged = function (questionId, moodIndex) {

    var questionIndex = $scope.questions.map(function (e) {return e.id}).indexOf(questionId);
    if ($scope.questions[questionIndex].moods[moodIndex].selectedintensity == "") {
      $scope.questions[questionIndex].moods[moodIndex].intensities = studyServices.getIntensities();  
    }
    

  }

  $scope.moodmapIntensityChanged = function (questionId, moodIndex) {

    var questionIndex = $scope.questions.map(function (e) {return e.id}).indexOf(questionId);
    var ans = [];

    for (var i = 0; i < $scope.questions[questionIndex].moods.length; i++) {
      if ($scope.questions[questionIndex].moods[i].selectedmood !== "" && $scope.questions[questionIndex].moods[i].selectedmood !== "") {
        ans.push($scope.questions[questionIndex].moods[i].selectedmood + ':' + $scope.questions[questionIndex].moods[i].selectedintensity);
      }
    };

    $scope.questions[questionIndex].answer = ans.join(';');
    console.log($scope.questions[questionIndex].answer);

  }

  $scope.multichoiceValueChanged = function(questionId) {
    var multiChoiceValues = [];

    var questionIndex = $scope.questions.map(function (e) { return e.id}).indexOf(questionId);

    for (var i = 0; i < $scope.questions[questionIndex].questionoptions.length; i++) {
      if ($scope.questions[questionIndex].questionoptions[i].checked) {
        multiChoiceValues.push($scope.questions[questionIndex].questionoptions[i].value);
      }
    }

    $scope.questions[questionIndex].answer = multiChoiceValues.join(';');
    console.log($scope.questions[questionId].answer);
  }

  $scope.nextQuestionGroup = function() {
    
    $scope.questiongroup.is_valid = true;

    $scope.questions = studyServices.validateQuestionGroup($scope.questions);

    for (var i = 0; i < $scope.questions.length; i++) {
      if (!($scope.questions[i].valid)) {
        $scope.questiongroup.is_valid = false;
        break;
      }
    }

    if($scope.questiongroup.is_valid) {
      console.log('Data was valid, get next questiongroup');
      //Get Answer object
      var answerObject  = studyServices.getAnswerObject($scope.questiongroup.substudy_id);
      console.log(answerObject);
      //Save Answers to answer object & DB

      //Get next QG-ID

      //If -1 --> end study, try to sync it up

      //Else: load next questiongroup

    } else {
      console.log('nope, there were errors');
    }

    console.log($scope.questions);
  }

  

});

