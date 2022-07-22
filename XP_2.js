const redmineObj = (host, api)=> {
  const Redmine = require('node-redmine');
  const hostname = host;
  const config = {
    apiKey: api
  };
  return new Redmine(hostname, config);
}

redmine = redmineObj('http://127.0.0.1:8080','31865a5b94751cd44c725e263577576bacfb6f10');

const calcXP = (priority, difficulty, estTime, spentTime)=> {
  const baseXP = (priority + difficulty) * (estTime);

  if(spentTime<= (1.5*estTime)){
    const varXP= (priority + difficulty) * (estTime - spentTime);
    return baseXP + varXP;
  }
  else{
    const varXP = -(baseXP/2) - Math.round(10*Math.log(spentTime - estTime));
    return baseXP + varXP;
  }
};

const updatedXP = (userId, newXP)=> {
  const XPObj = {
    user: {
      custom_fields: [{ id: 1, value: newXP }]
    }
  };

  redmine.update_user(userId, XPObj, function (_, _) {
  });
}
const issueData = (issueId)=> {
  return new Promise(function (resolve, _) {
    redmine.get_issue_by_id(issueId, {}, function (err, data) {
      if (err)
        throw err;

      const info = {
        estTime: Number(data.issue.total_estimated_hours),
        spentTime: Number(data.issue.spent_hours),
        priority: Number(data.issue.priority.id)
      }

      switch (data.issue.custom_fields[0].value) {
        case 'Very Easy': info.difficulty = 1; break;
        case 'Easy': info.difficulty = 2; break;
        case 'Medium': info.difficulty = 3; break;
        case 'Hard': info.difficulty = 4; break;
        case 'Very Hard': info.difficulty = 5; break;
      }
      resolve(info);
    });
  });
}
const getXP = (userId)=> {
 return new Promise(function(resolve, _){
  redmine.get_user_by_id(userId, {}, function (err, data) {
    if (err) throw err;
    resolve(data.user.custom_fields[0].value);
  });
 });
}

const update = (userId, issueId)=> {
  const oldXP=[];
  getXP(userId).then(function(val){
    oldXP.value = Number(val);    
    return issueData(issueId);
  }).then(function(obj){
    const newXP = oldXP.value + calcXP(obj.priority,obj.difficulty,obj.estTime,obj.spentTime);
    updatedXP(userId,newXP);
  }).catch(function (err) {
    console.log(err + " !!!!");
  });
}

