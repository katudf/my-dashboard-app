import {
    collection, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import type { Project, Task, Worker, Assignment } from '../lib/types';
import { COLOR_OPTIONS } from '../lib/constants';

const getCollectionRef = (collectionName: string) => collection(db, 'artifacts', appId, collectionName);

// ★★★ここからが新しいコード★★★
/**
 * アイテムの配列を受け取り、その順番をFirestoreに保存する関数
 * @param items IDを持つオブジェクトの配列
 * @param collectionName 'projects' または 'workers'
 */
export const updateItemsOrder = async (
  items: { id: string }[],
  collectionName: 'projects' | 'workers'
) => {
  const batch = writeBatch(db);
  const collRef = getCollectionRef(collectionName);

  items.forEach((item, index) => {
    if (item.id) { // Make sure item has an id
      const docRef = doc(collRef, item.id);
      batch.update(docRef, { order: index });
    }
  });

  await batch.commit();
};
// ★★★ここまでが新しいコード★★★


export const saveProject = async (projectToSave: Project, allProjects: Project[]) => {
    const { id, ...projectData } = projectToSave;
    const collRef = getCollectionRef('projects');

    if (id && id !== "0") {
        // 既存プロジェクトの更新
        await updateDoc(doc(collRef, id), projectData);
    } else {
        // 新規プロジェクトの追加
        let dataToSave = { ...projectData };
        if (!dataToSave.color) {
            const randomColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
            dataToSave.color = randomColor.color;
            dataToSave.borderColor = randomColor.borderColor;
        }
        // ★★★ orderフィールドを追加 ★★★
        dataToSave.order = allProjects.length;
        await addDoc(collRef, dataToSave);
    }
};

export const deleteTask = async (taskId: string) => {
    if (!taskId || taskId.startsWith('new-')) return;
    await deleteDoc(doc(getCollectionRef('tasks'), taskId));
};

export const deleteProject = async (projectId: string) => {
    const batch = writeBatch(db);
    const projectDocRef = doc(getCollectionRef('projects'), projectId);
    batch.delete(projectDocRef);
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

export const saveWorker = async (workerToSave: Omit<Worker, 'id'> & { id?: string }, allWorkers: Worker[]) => {
    const { id, ...workerData } = workerToSave;
    const collRef = getCollectionRef('workers');

    if (id && id !== "0") {
        // 既存作業員の更新
        const dataToUpdate = {
             name: workerData.name,
             nameKana: workerData.nameKana || '',
             birthDate: workerData.birthDate || null,
        };
        await updateDoc(doc(collRef, id), dataToUpdate);
    } else {
        // 新規作業員の追加
        const dataToSave = {
            name: workerData.name,
            nameKana: workerData.nameKana || '',
            birthDate: workerData.birthDate || null,
            // ★★★ orderフィールドを追加 ★★★
            order: allWorkers.length,
        };
        await addDoc(collRef, dataToSave);
    }
};

export const deleteWorker = async (workerId: string) => {
    // TODO: Delete related assignments if necessary
    await deleteDoc(doc(getCollectionRef('workers'), workerId));
};

export const saveAssignment = async (key: string, newAssignments: Assignment[]) => {
    const docRef = doc(getCollectionRef('assignments'), key);
    await setDoc(docRef, { assignments: newAssignments });
};
