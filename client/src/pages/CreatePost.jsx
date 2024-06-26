import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import {Alert, Button, FileInput, Select, TextInput} from 'flowbite-react'
import { useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { app } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
  const [file, setFile] = useState(null);
  const [uploadError,setUploadError] = useState(null)
  const [uploadProgress,setUploadProgress] = useState(null)
  const [formData,setFormData] = useState({})
  const [publishError, setPublishError] = useState(null)
  const navigate = useNavigate();

  const handleUploadImage = async()=>{
    try {
      if(!file){
        setUploadError('Please select image file')
        return;
      }
      setUploadError(null)
      const storage = getStorage(app)
      const fileName = new Date().getTime()+ '-' + file.name;
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef,file);
  
      uploadTask.on('state_changed', (snapshot)=> {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress.toFixed(0))
      },
      (error) => {
        setUploadError('Image Upload Failed')
        setUploadProgress(null)
      },
      ()=> {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadUrl)=>{
          setUploadError(null)
          setUploadProgress(null)  
          setFormData({...formData, image: downloadUrl});
        });
      });
    } catch (error) {
      setUploadError(error.message)
      setUploadProgress('Image Upload Failed')
    }
  }

  const handleSubmit = async(e)=>{
    e.preventDefault();
    try {
      const res = await fetch('/api/post/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formData)
      });
      const data = await res.json()
      if(!res.ok){
        setPublishError(data.message);
        return;
      }
      setPublishError(null)
      navigate(`/post/${data.slug}`)
    } catch (error) {
      setPublishError(error.message)
    }
  }
  
  return (
    <div className='max-w-3xl p-3 mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>
        Create a Post
      </h1>
      <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
        <div className='flex flex-col gap-4 sm:flex-row justify-between'>
          <TextInput type='text' id='title' placeholder='Title' className='flex-1' required  onChange={
            (e)=>setFormData({...formData, title: e.target.value})
          }/>
          <Select  onChange={(e)=>setFormData({...formData, category: e.target.value})}>
            <option value="uncategorized">Select a category</option>
            <option value="javascript">Javascript</option>
            <option value="reactJs">ReactJs</option>
            <option value="nextJs">NextJs</option>
          </Select>
        </div>
        <div className='flex flex-col gap-4 items-center justify-between
         border-4 border-teal-500 border-dotted p-3'>
          <div className='flex gap-4 w-full items-center justify-between'>
            <FileInput type='file' accept='image/*' onChange={(e)=> setFile(e.target.files[0])}/>
            <Button type='submit' gradientDuoTone='purpleToBlue' size='sm' outline
            onClick={handleUploadImage} disabled={uploadProgress}>
              {uploadProgress ? (
                <div className='w-16 h-16'>
                  <CircularProgressbar value={uploadProgress} text={`${uploadProgress || 0}%`}/>
                </div>
              ):('Upload Image')}
            </Button>
          </div>
          {formData.image && (
            <img src={formData.image} alt={formData.title} className='w-full h-72 rounded-md' />
          )}
          {uploadError && <Alert color='failure'>{uploadError}</Alert>}
        </div>
        <ReactQuill theme="snow" className='h-72 mb-12' required onChange={(value)=>setFormData({...formData, content: value})}/>
        <Button type='submit' gradientDuoTone='purpleToPink'>Publish</Button>
        {publishError && (<Alert color='failure'>{publishError}</Alert>)}
      </form>
    </div>
  )
}
