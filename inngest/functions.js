import { db } from "@/configs/db";
import { inngest } from "./client";
import {
  CHAPTER_NOTES_TABLE,
  STUDY_MATERIAL_TABLE,
  STUDY_TYPE_CONTENT_TABLE,
  USER_TABLE,
} from "@/configs/schema";
import { eq } from "drizzle-orm";
import {
  generateNotesAiModel,
  GenerateQnAAiModel,
  GenerateQuizAiModel,
  GenerateStudyTypeContentAiModel,
} from "@/configs/AiModel";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello World!" };
  }
);

export const CreateNewUser = inngest.createFunction(
  { id: "create-user" },
  { event: "user.create" },
  async ({ event, step }) => {
    const { user } = event.data;
    //Get event data
    const result = await step.run(
      "CheckUser And create new if not in DB",
      async () => {
        //Check if the user already exist
        const result = await db
          .select()
          .from(USER_TABLE)
          .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

        if (result?.length === 0) {
          //If not , then add to db
          const userResp = await db
            .insert(USER_TABLE)
            .values({
              name: user?.fullName,
              email: user?.primaryEmailAddress?.emailAddress,
            })
            .returning({ id: USER_TABLE.id });
          return userResp;
        }
        return result;
      }
    );
    return "Success";
  }

  //Step is to send welcome email notification

  //Step to send email notification after 3 days once user joined
);

export const GenerateNotes = inngest.createFunction(
  { id: "generate-course" },
  { event: "notes.generate" },
  async ({ event, step }) => {
    const { course } = event.data;

    // Generaet notes for each chapter with ai
    const notesResult = await step.run("Generate Chapter Notes", async () => {
      const Chapters = course?.courseLayout?.chapters;
      let index = 0;
      Chapters.forEach(async (chapter) => {
        const PROMPT =
          "Generate exam material detail content for each chapter. Make sure to include all topic point in the content, make sure to give content in HTML format (DO not add HTML, Head, Body, title tag), The Chapters:" +
          JSON.stringify(chapter);

        const result = await generateNotesAiModel.sendMessage(PROMPT);
        const aiResp = result.response.text();

        await db.insert(CHAPTER_NOTES_TABLE).values({
          chapterId: index,
          courseId: course?.courseId,
          notes: aiResp,
        });
        index = index + 1;
      });
      return "Completed";
    });

    //Update Status to ready
    const updateCourseStatusResult = await step.run(
      "Update Course Status to Ready",
      async () => {
        const result = await db
          .update(STUDY_MATERIAL_TABLE)
          .set({
            status: "Ready",
          })
          .where(eq(STUDY_MATERIAL_TABLE.courseId, course?.courseId));
        return "Success";
      }
    );
  }
);

//Used to generate flash cards, quiz and qna
export const GenerateStudyTypeContent = inngest.createFunction(
  { id: "Generate Study Type Content" },
  { event: "studyType.content" },

  async ({ event, step }) => {
    const { studyType, prompt, courseId, recordId } = event.data;

    const AiResult = await step.run(
      "Generating FlashCard using Ai",
      async () => {
        let result;
        if (studyType === "Flashcard") {
          result = await GenerateStudyTypeContentAiModel.sendMessage(prompt);
        } else if (studyType === "Quiz") {
          result = await GenerateQuizAiModel.sendMessage(prompt);
        } else if (studyType === "Question/Answer") {
          result = await GenerateQnAAiModel.sendMessage(prompt); // Add new condition
        } else {
          throw new Error(`Unsupported studyType: ${studyType}`);
        }
        const AIResult = JSON.parse(result.response.text());
        return AIResult;
      }
    );

    //Save the result
    const DbResult = await step.run("Save Result to DB", async () => {
      const result = await db
        .update(STUDY_TYPE_CONTENT_TABLE)
        .set({
          content: AiResult,
          status: "Ready",
        })
        .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));

      return "Data Inserted";
    });
  }
);
