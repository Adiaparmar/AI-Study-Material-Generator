"use client";
import DashboardHeader from "@/app/dashboard/_components/DashboardHeader";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import CourseIntroCard from "./components/CourseIntroCard";
import StudyMaterialSection from "./components/StudyMaterialSection";
import ChapterList from "./components/ChapterList";

function Course() {
  const { courseId } = useParams();
  const [course, setCourse] = useState();
  useEffect(() => {
    GetCourse();
  }, []);

  const GetCourse = async () => {
    const result = await axios.get("/api/courses?courseId=" + courseId);
    console.log(result);
    setCourse(result.data.result);
  };
  return (
    <div>
      <DashboardHeader />
      <div className="mx-10 md:mx-36 lg:mx-60 mt-10">
        {/* Course Intro */}
        <CourseIntroCard course={course} />
        {/* Study Materials Options */}
        <StudyMaterialSection />
        {/* Chapter List */}
        <ChapterList course={course} />
      </div>
    </div>
  );
}

export default Course;
