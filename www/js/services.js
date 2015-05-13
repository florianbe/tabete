angular.module('tabete.services', ['ngCordova'])
	.factory('devTest', function($http, $cordovaSQLite, $q) {
		var self = this;
		// var url = "http://anthill-inside.net/tabea_test/api/v1/study/1?password=zeitver2015";
    	var url = "http://tabea.dev:8080/api/v1/study/1?password=geheim";
    	// var url = "http://tabea.dev:8080/api/v1/study/getid?study=te_stu&password=geheim";

	    studyData = {};
	    studyData.studyServer = 'http://tabea.dev:8080';
	    studyData.studyName = 'te_stu';
	    studyData.studyPassword = 'geheim';

		//DEVELOPER function: clears all tables in db
		this.devReset = function() {
			//Database: delete tables
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS servers");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS studies");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS substudies");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS signalpoints");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questiongroups");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questions");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS rules");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS questionoptions");
			$cordovaSQLite.execute(db, "DROP TABLE IF EXISTS answers");

			console.log('dev: all tables deleted');

			//Database: create tables
		    //SERVERS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS servers (id integer primary key, url text, subject_id integer, subject_name text)");
		    //STUDIES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS studies (id integer primary key, version integer, server_id integer, remote_id integer, name text, description text, state text, start_date text, end_date text, finalupload_date text)");
		    //SUBSTUDIES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS substudies (id integer primary key, version integer, study_id integer, title text, triggertype text, description text)");
		    //SIGNAL POINTS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS signalpoints (id integer primary key, substudy_id integer, signal_date text)");
		    //QUESTION GROUPS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questiongroups (id integer primary key, version integer, substudy_id integer, name text, sequence_id integer, randomorder integer)");
		    //RULES
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS rules (id integer primary key, questiongroup_id integer, question_id integer, answer_value text)");
		    //QUESTIONS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questions (id integer primary key, remote_id integer, version integer, questiongroup_id integer, sequence_id integer, type text, mandatory integer, text text, min text, max text, step text)");
		    //QUESTIONS OPTIONS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS questionoptions (id integer primary key, question_id integer, code text, description text, value text)");
		    //ANSWERS
		    $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS answers (id integer primary key, question_id integer, answer text, testanswer integer, answer_date text, signal_date text)");

		    console.log('dev: all tables reset');
		};

		this.testHttp = function() {
			$http.get(url).then(function(data) {
				console.log(data.data.study.title);
				console.log('dev: test Http finished');
      			return data.data.study.id;
      			
      			//devTest.printJsonString(data.data.study);
      		}, function(err) {
      			console.error(err);
      		});    		
		};

		this.testImport = function() {
			// devTest.insertStudy(studyData, data.data.study);
			console.log('dev: Data import finished');
		};

		return self;
	});