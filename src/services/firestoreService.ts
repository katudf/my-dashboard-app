import {
    collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import type { Project, Task, Worker, Assignment } from '../lib/types';
import { COLOR_OPTIONS } from '../lib/constants';

const getCollectionRef = (collectionName: string) => collection(db, 'artifacts', appId, collectionName);

export const saveProject = async (projectToSave: Project) => {
    const { id, ...projectData } = projectToSave;
    const collRef = getCollectionRef('projects');
    let dataToSave = { ...projectData };

    if (id && id !== "0") {
        await updateDoc(doc(collRef, id), dataToSave);
    } else {
        if (!dataToSave.color) {
            const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
            dataToSave.color = randomColor.color;
            dataToSave.borderColor = randomColor.borderColor;
        }
        await addDoc(collRef, dataToSave);
    }
};

export const deleteTask = async (taskId: string) => {
    if (!taskId || taskId.startsWith('new-')) return;
    await deleteDoc(doc(getCollectionRef('tasks'), taskId));
};

export const deleteProject = async (projectId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(getCollectionRef('projects'), projectId));
    const tasksSnapshot = await getDocs(query(getCollectionRef('tasks'), where("projectId", "==", projectId)));
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
};

export const saveTask = async (taskToSave: Task) => {
    const { id, ...taskData } = taskToSave;
    const dataForFirestore = {
        ...taskData,
        color: taskData.color ?? null,
    };
    const collRef = getCollectionRef('tasks');
    if (id && !id.startsWith("new-")) {
        await updateDoc(doc(collRef, id), dataForFirestore);
    } else {
        await addDoc(collRef, dataForFirestore);
    }
};

export const saveWorker = async (workerToSave: Omit<Worker, 'id'> & { id?: string }) => {
    const { id, ...workerData } = workerToSave;
    const collRef = getCollectionRef('workers');
    const dataToSave = {
        name: workerData.name,
        nameKana: workerData.nameKana || '',
        birthDate: workerData.birthDate || null
    };
    if (id && id !== "0") {
        await updateDoc(doc(collRef, id), dataToSave);
    } else {
        await addDoc(collRef, dataToSave);
    }
};

export const deleteWorker = async (workerId: string) => {
    await deleteDoc(doc(getCollectionRef('workers'), workerId));
};

export const saveAssignment = async (key: string, newAssignments: Assignment[]) => {
    const docRef = doc(db, 'artifacts', appId, 'assignments', key);
    await setDoc(docRef, { assignments: newAssignments });
};
