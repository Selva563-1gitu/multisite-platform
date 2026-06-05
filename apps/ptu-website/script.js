var campusLife=["Constructed in 1994, the PTU Library is located in an easily accessible central part of the PTU Campus, surrounded by various departments. The Library building with its striking architecture has been carefully planned to provide more space and natural lighting for the comfort of the users. It houses over 56,000 books of diverse disciplines from national and international authors, numbers of research publications, science journals and also provides e-access to it's staffs and students through which a huge collection of e-books and journals is available.",
    
    "The auditorium of PTU is a marvellous construction with a seating capacity of around 800 people. The main hall of the auditorium is engineered for fantastic acoustics and have all the necessary equipment for hosting a performance, function or presentation. The two storeyed building also houses a cafeteria with attached kitchen, 2 seminar halls and green rooms.",
    "The sports complex of PTU bustles with energy all the time and has been fostering several athletes at PTU for ages now. The Sports Complex encompasses the basketball, football/cricket, volleyball and handball courts. Sports events are conducted round the year concluded by a grand Sports day to felicitate the champions of the year.",
    "The shopping complex at the campus caters to all essential needs of Day scholars and hostellers. There is a stationery store, browsing centre and a snack bar within the complex.",
    "There are 3 boys’ hostels (Varali, Saranga and Charukesi named after ragas of Carnatic Music) and a girls’ hostel (Tharangini). The hostels at PTU witness students of varied culture and diversities from various parts of India. The hostels have attached mess and serves a menu decided collectively by the students of the hostel. Every hostel is equipped with Wi-Fi facility and has a common room and spacious areas where the members can socialize, relax or play. Hostellers celebrate festivals like Chithirai Thiruvizha, Onam and Holi with great energy and responsibility every year.",
    "The TNP (Training and Placement) Cell provide trainings and hosts placement drives for industry keen students of the college. It is well equipped with systems to conduct online tests and has various halls and rooms to suit drive scenarios like group discussions, interviews and mass testing. The building also houses the Atal Incubation Centre which screens viable, innovative ideas presented by the students and incubates it for commercial production for promoting Entrepreneurship within the campus.",
    "Atal Incubation Centre - Pondicherry Engineering College Foundation (AIC-PECF) is fully supported and funded by Atal Innovation Mission (AIM), Niti Aayog, Government of India. AIC-PECF was initiated to provide a platform to assist and enable young entrepreneurs to initiate startups for the commercial exploitation of technologies developed by them",
    "The Open Air Theatre (OAT) at PTU is a spacious theatre with the capacity to accommodate around 500 people. The OAT would witness a lot of fun gatherings. People gather and enjoy with zest here for DJ night or any fest organized there. Another open air stage is constructed behind the auditorium which can accommodate even more audience. The spot is perfect with cool breeze blowing for hosting night-time functions under the stars.",
    "There is a dispensary at the premises functioning all round the clock, along with an ambulance for emergency use. There is a well-trained doctor and nurse posted to take care of student and staff ailments."
]
var init=0;
function infofn(index){
    document.getElementById("campus-life-body-p").innerHTML=campusLife[index];
}
document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("campus-life-body-p").innerHTML=campusLife[init];
    if(window.innerWidth<='680'){
        let prevPara=document.querySelector("#ptu p").textContent;
        document.querySelector("#ptu p").textContent=prevPara.slice(0,370);
        document.querySelector("#ptu p").innerHTML+="<span>[Read more]</span>";
        document.querySelector("#ptu span").style.display="inline";
        document.querySelector('#ptu span').addEventListener('click',()=>{
            document.querySelector("#ptu p").textContent=prevPara;
        })
        // console.log(prevPara)
    }
})

function btnclick(id){
    console.log("click")
    console.log(document.querySelector(`#${id}~.buttonspace`).style.backgroundColor);
        // document.querySelector(`#${id}~.buttonspace`).style.display="none"
        // console.log("hello");
    // }

}
function moveright(){
    if(init>-1000){
        
        init-=500;
        document.querySelector(".alice-carousel__stage").style.transform=`translateX(${init}px)`;
        if(init<-500){
            
        document.querySelector(".alice-carousel__dots :nth-child(1)").classList.add("__active");
        if(document.querySelector(".alice-carousel__dots :nth-child(2)").classList.contains("__active"))
        document.querySelector(".alice-carousel__dots :nth-child(2)").classList.remove("__active");
        }
        

    }
}
function moveleft(){
    console.log(init);
    if(init<0){
        
    init+=500;
    document.querySelector(".alice-carousel__stage").style.transform=`translateX(${init}px)`;
    if(init>-500){
        document.querySelector(".alice-carousel__dots :nth-child(2)").classList.add("__active");
        if(document.querySelector(".alice-carousel__dots :nth-child(1)").classList.contains("__active"))
        document.querySelector(".alice-carousel__dots :nth-child(1)").classList.remove("__active");

    }
    }
}
function sidebaropen(){
    document.querySelector("#sidebar").style.display="flex"; 
}
function sidebarclose(){
    document.querySelector("#sidebar").style.display="none"; 
}
document.querySelector(".alice-carousel").addEventListener("scroll", ()=>{
    if(document.querySelector(".alice-carousel__stage").style.transform>-500){
        document.querySelector(".alice-carousel__dots :nth-child(2)").classList.add("__active");
        if(document.querySelector(".alice-carousel__dots :nth-child(1)").classList.contains("__active"))
        document.querySelector(".alice-carousel__dots :nth-child(1)").classList.remove("__active");
    }
    if(document.querySelector(".alice-carousel__stage").style.transform<-500){
        document.querySelector(".alice-carousel__dots :nth-child(1)").classList.add("__active");
        if(document.querySelector(".alice-carousel__dots :nth-child(2)").classList.contains("__active"))
        document.querySelector(".alice-carousel__dots :nth-child(2)").classList.remove("__active");
    }
    })