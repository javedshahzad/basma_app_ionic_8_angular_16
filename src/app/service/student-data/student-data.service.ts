import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class StudentDataService {
	student:any;
	studentList:any=[];
	studentNote:any=[];
  staticalData:any=[];
  constructor(public http: HttpClient, public sqlite: SQLite, public platform: Platform,
  			  private storage: Storage	) {

  }
  checkStudent(student){
	this.platform.ready().then(()=>{
		this.storage.get('offlineStudent').then((data) => {
			if(data){
				this.studentList=data;
				this.studentList[student.sid]=student;
			}else{
				this.studentList[student.sid]=student;
			}
				this.storage.set('offlineStudent', this.studentList);
		});
	})
  }  
  checkStudentNotes(note,student_id){
	this.platform.ready().then(()=>{
  	this.storage.get('offlineStudentNote').then((data) => {
  		if(data){
  			this.studentNote=data;
  			this.studentNote[student_id]=note;
  		}else{
  			this.studentNote[student_id]=note;
  		}
  			this.storage.set('offlineStudentNote', this.studentNote);
  		//	console.log('offlineStudentNote',this.studentNote)
  	});
})

  }

  getStudent(student_id, callback:any,error:any){
		this.platform.ready().then(()=>{
  	this.storage.get('offlineStudent').then((res) => {
  		if(res){
  			this.studentList=res;
  			//console.log(this.studentList,student_id);
  			let data=this.studentList[student_id];
		  		if(data){
		  			callback(data);
		  		}else{
		  			error(data);
		  		}
  		}else{
		  			error('data');

  		}
	})
  	});
  }
  getStudentNote(student_id, callback:any,error:any){
	this.platform.ready().then(()=>{
  		this.storage.get('offlineStudentNote').then((res) => {
	  		if(res){
	  			this.studentNote=res;
	  			let data=this.studentNote[student_id];
			  		if(data){
			  			callback(data);
			  		}else{
			  			error(data);
			  		}
	  		}else{
			  	error('data');
	  		}

	  	});
	})
  }

  setStaticalData(user_ID,data){
	this.platform.ready().then(()=>{
    this.storage.get('offlinestatical').then(res=>{
      if(res){
        this.staticalData=res;
          this.staticalData[user_ID]=data
      }else{
          this.staticalData[user_ID]=data
      }
      this.storage.set('offlinestatical',this.staticalData);
    })
})
  }

  getOfflineStatical(user_ID,callback:any){
	this.platform.ready().then(()=>{
    this.storage.get('offlinestatical').then(res=>{
      if(res){
        console.log('offlinestaticalGet',res);
        callback(res[user_ID]);
      }else{
        callback([]);
      }
    })
})
  }


}
