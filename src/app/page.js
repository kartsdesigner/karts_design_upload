"use client"
import { useState, useEffect } from "react";
import { pageStore } from "./zustand/pageStore";
import { createClient } from 'contentful-management';

export default function Home() {
    const [designType, setDesignType] = useState('');
    const [category, setCategory] = useState([]);
    const [thumbnail, setThumbnail] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [works, setWorks] = useState([]);
    const [projectName, setProjectName]=useState('');
    const [nameKr,setNameKr]=useState('');
    const [nameEng,setNameEng]=useState('');
    const [major, setMajor]=useState('');
    const [advisor, setAdvisor]=useState('');
    const [statementKr,setStatementKr]=useState('');
    const [statementEng,setStatementEng]=useState('');
    const [mainVimeoEmbedLink,setMainVimeoEmbedLink] = useState('');
    const [topEmbed,setTopEmbed] = useState('');
    const [bottomEmbed,setBottomEmbed] = useState('');
    const [introductionKr,setIntroductionKr] = useState('');
    const [introductionEng ,setIntroductionEng] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber,setPhoneNumber] = useState('');
    const [instagramLink,setInstagramLink] = useState('');
    const [webLink,setWebLink] = useState('');
    const [vimeoLink,setVimeoLink] = useState('');
    const [studentId,setStudentId]=useState('');
    const [exhibitionYear, setExhibitionYear]=useState(0);
    const [uploading, setUploading] = useState(false);

    const {uploadPage, fetchPageData}=pageStore();
    fetchPageData();

    console.log(uploadPage);

    const spaceId = process.env.NEXT_PUBLIC_SPACE_ID;
    const cmaToken = process.env.NEXT_PUBLIC_MANAGEMENT_API_TOKEN;
    const client = createClient({
        accessToken: cmaToken,
    });

    function base64ToBuffer(base64) {
        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }

    const uploadImage = async (file, fileName) => {
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment('master');

        const bufferData = base64ToBuffer(file);
    
        const asset = await environment.createAssetFromFiles({
          fields: {
            title: { 'en-US': fileName },
            file: { 'en-US': { contentType: "Asset", fileName: fileName, file: bufferData } },
          },
        });
    
        const processedAsset = await asset.processForAllLocales();
    
        // 이미지 업로드 후 반환되는 Asset ID
        return processedAsset.sys.id;
      };

      function createRichTextEntry(text) {
        const paragraphs = text.split('\n').filter(Boolean);
      
        return {
          nodeType: 'document',
          data: {},
          content: paragraphs.map((paragraph) => ({
            nodeType: 'paragraph',
            data: {},
            content: [
              {
                nodeType: 'text',
                value: paragraph,
                marks: [],
                data:{},
              },
            ],
          })),
        };
      }

    const createContentfulEntry =async(formData)=>{
        try{

            const space = await client.getSpace(spaceId);
            const environment = await space.getEnvironment('master');

            //이미지를 contentful asset에 업로드
            const thumbnailFileName = studentId+'Thumbnail';
            const mainImageFileName = studentId+'mainImage';
            const thumbnailAssetId = await uploadImage(formData.thumbnail,thumbnailFileName);
            const mainImageAssetId = await uploadImage(formData.mainImage, mainImageFileName);
            const worksAssetIds = await Promise.all(formData.works.map((file, index) => {
                const workFileName = studentId + 'works' + index;
                return uploadImage(file, workFileName);
            }));

            const entry = await environment.createEntry('portfolio',{
                fields: {
                  exhibitionYear:{'en-US' : formData.exhibitionYear},
                  studentid: { 'en-US': formData.studentId },
                  projectName: { 'en-US': formData.projectName },
                  nameKr: { 'en-US': formData.nameKr },
                  nameEng: { 'en-US': formData.nameEng },
                  major: { 'en-US': formData.major },
                  advisor: { 'en-US': formData.advisor },
                  category: { 'en-US': formData.category },
                  thumbnail: { 'en-US': { sys: { type: 'Link', linkType: 'Asset', id: thumbnailAssetId } } }, 
                  mainImage: { 'en-US': { sys: { type: 'Link', linkType: 'Asset', id: mainImageAssetId } } }, 
                  mainVimeoEmbedLink: { 'en-US': formData.mainVimeoEmbedLink },
                  introductionKr: { 'en-US': formData.introductionKr},
                  statementKr: {'en-US': createRichTextEntry(formData.statementKr),},
                  statementEng: {'en-US': createRichTextEntry(formData.statementEng),},
                  introductionEng: { 'en-US': formData.introductionEng},
                  email: { 'en-US': formData.email },
                  phoneNumber: { 'en-US': formData.phoneNumber },
                  instagramLink: { 'en-US': formData.instagramLink },
                  webLink: { 'en-US': formData.webLink },
                  vimeoLink: { 'en-US': formData.vimeoLink },
                  topEmbed: { 'en-US': formData.topEmbed },
                  works: {
                    'en-US': worksAssetIds.map((assetId) => ({ sys: { type: 'Link', linkType: 'Asset', id: assetId } })),
                  }, 
                  bottomEmbed: { 'en-US': formData.bottomEmbed },
                  // ... Add mappings for other fields
                },
              });

              const entryId = entry.sys.id;

              // Asset publish
              await publishAsset(thumbnailAssetId);
              await publishAsset(mainImageAssetId);
              await Promise.all(worksAssetIds.map(publishAsset));

              //await entry.publish();

            //   console.log('Contentful entry created successfully. Entry ID:', entryId);
            setUploading(false);
            window.alert("업로드가 완료됐습니다.");
        } catch(error){
            console.log('error is...',error);
            setUploading(false);
            window.alert("업로드 실패");
        }
    };

    //asset publish
    const publishAsset = async (assetId) => {
        const space = await client.getSpace(spaceId);
        const environment = await space.getEnvironment('master');
        try {
          const asset = await environment.getAsset(assetId);
          await asset.publish();
          console.log(`Asset published successfully. Asset ID: ${assetId}`);
        } catch (error) {
          console.log(`Error publishing asset. Asset ID: ${assetId}`, error);
        }
      };


    const handleFormSubmit = async(e) => {
        e.preventDefault();

        window.alert('업로드하시겠습니까? 업로드가 시작되면 완료창이 뜰때까지 브라우저를 닫지 말아주세요');
        setUploading(true);

        const formData = {
            studentId,
            projectName,
            nameKr,
            nameEng,
            major,
            advisor,
            category,
            introductionEng,
            introductionKr,
            statementKr,
            statementEng,
            thumbnail,
            mainImage,
            mainVimeoEmbedLink,
            email,
            phoneNumber,
            instagramLink,
            webLink,
            vimeoLink,
            topEmbed,
            works,
            bottomEmbed,
            exhibitionYear,
            // ... add other fields as needed
          };
      
        // Create Contentful entry
        await createContentfulEntry(formData);

    };

    const handleInputChange = (e) => {
        setDesignType(e.target.value);
    };

    const handleAddDesignType = () => {
        if (designType.trim() !== '') {
            setCategory([...category, designType]);
            setDesignType(''); // Clear the input field after adding a name
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
        e.preventDefault();
        handleAddDesignType();
        }
    };

    const handleDeleteDesignType = (index) => {
        const updatedList = [...category];
        updatedList.splice(index, 1);
        setCategory(updatedList);
    };



    const handleThumbnailImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setThumbnail(reader.result);
        };
        reader.readAsDataURL(file);
        }
    };

    

    const handleMainImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setMainImage(reader.result);
        };
        reader.readAsDataURL(file);
        }
    };

    

    const handleImageChange = (e) => {
        const files = e.target.files;

        if (files.length > 0) {
        const newImages = Array.from(files).map((file) => {
            const reader = new FileReader();
            return new Promise((resolve) => {
            reader.onloadend = () => {
                resolve(reader.result);
            };
            reader.readAsDataURL(file);
            });
        });

        Promise.all(newImages).then((images) => {
            setWorks((prevImages) => [...prevImages, ...images]);
        });
        }
    };

    const handleRemoveImage = (index) => {
        const newImages = [...works];
        newImages.splice(index, 1);
        setWorks(newImages);
    };

    useEffect(() => {
        // fetchPageData();

        const currentYear = new Date().getFullYear();
        setExhibitionYear(currentYear);

        const handleBeforeUnload = (event) => {
          const message = '페이지를 벗어날 경우 내용이 저장되지 않습니다. 정말로 떠나시겠습니까?';
          event.returnValue = message; // Standard for most browsers
          return message; // For some older browsers
        };
    
        window.addEventListener('beforeunload', handleBeforeUnload);
    
        return () => {
          // Cleanup: Remove the event listener when the component is unmounted
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      }, []);

  return (
      <div className="upload">
          {uploadPage?(<form onSubmit={handleFormSubmit}>
            {uploadPage?(<h1>true</h1>):(<h1>false</h1>)}
            <div>*업로드된 내용은 웹사이트에 바로 반영되지 않습니다. 업로드 후 관리자가 확인 후 publish로 변경해야 사이트에 반영이 됩니다.</div>
              <section>
                  <h2>프로젝트 정보</h2>
                  <div>
                      <h4>Project Name</h4>
                      <input type="text" placeholder="프로젝트 제목" required value={projectName} onChange={(e)=>setProjectName(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Student ID</h4>
                      <input type="text" placeholder="학번"required value={studentId} onChange={(e)=>setStudentId(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Name-kr</h4>
                      <input type="text" placeholder="한글 이름" required value={nameKr} onChange={(e)=>setNameKr(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Name-Eng</h4>
                      <input type="text" placeholder="영문 이름" required value={nameEng} onChange={(e)=>setNameEng(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Major</h4>
                      <input type="text" placeholder="세부 전공" required value={major} onChange={(e)=>setMajor(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Advisor</h4>
                      <input type="text" placeholder="담당 교수님 성함" required value={advisor} onChange={(e)=>setAdvisor(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>Category</h4>
                      <input
                          type="text"
                          style={{width:'200px'}}
                          placeholder="프로젝트 디자인 타입 - 다중 입력 가능"
                          value={designType}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyPress}
                      />
                      <ul>
                          {category.map((item, index) => (
                          <li key={index}>
                              {item}
                              <button type="button" onClick={() => handleDeleteDesignType(index)}>X</button>
                          </li>
                          ))}
                      </ul>
                  </div>
                  <div><span style={{color:'red'}}>
                      * 입력란에 design type을 입력한 후 &apos;Enter&apos;를 눌러야 적용이 됩니다.</span></div>
                  <div>
                      <h4>Statement-Kr</h4><br/>
                      <textarea placeholder="프로젝트 설명 - 한글" required  value={statementKr} onChange={(e)=>setStatementKr(e.target.value)} className="statement"/>
                  </div>
                  <div>
                      <h4>Statement-Eng</h4><br/>
                      <textarea placeholder="프로젝트 설명 - 영문" required value={statementEng} onChange={(e)=>setStatementEng(e.target.value)} className="statement"/>
                  </div>
                  <div><span style={{color:'red'}}>
                      * 문단은 &apos;줄바꿈 한번&apos;으로 구분해주세요.</span></div>
              </section>
              <section>
                  <h2>media</h2>
                  <div>
                      <h4>thumbnail</h4>
                      <span>(미리보기용 대표 이미지)</span><br/>
                      <input 
                          type="file"
                          required
                          accept="image/*" 
                          onChange={handleThumbnailImageChange} /><br/>
                      {thumbnail && (
                          <img src={thumbnail} alt="미리보기" style={{ maxWidth: '100%', maxHeight: '150px' }} />
                      )}
                  </div>
                  <div style={{borderLeft:'black 1px solid'}}>
                      <div>
                          <h4>main poster</h4>
                          <span>(프로젝트 메인 이미지 또는 임베드 영상 썸네일)</span><br/>
                          <input 
                              type="file" 
                              required
                              accept="image/*" 
                              onChange={handleMainImageChange} />
                          {mainImage && (
                              <img src={mainImage} alt="미리보기" style={{ maxWidth: '100%', maxHeight: '150px' }} />
                          )}
                      </div>
                      <div>
                          <h4>main embed link</h4>
                          <input type="text" placeholder="비메오 영상 임베드 링크"  value={mainVimeoEmbedLink} onChange={(e)=>setMainVimeoEmbedLink(e.target.value)}></input>
                      </div>
                  </div>
                  <div><span style={{color:'red'}}>
                      * 이미지를 삽입은 main poster만, 비디오 삽입은 embed link와 영상 썸네일로 사용할 이미지를 첨부해주세요.</span></div>
                  <div>
                      <h4>top embed link (선택)</h4>
                      <input type="text" placeholder="비메오 영상 임베드 링크"  value={topEmbed} onChange={(e)=>setTopEmbed(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>works</h4>
                      <span>( 프로젝트 상세 이미지 - 이미지 개수 제한 없음, gif가능, 첨부한 순으로 업로드됩니다.)</span><br/>
                      <input type="file" required accept="image/*" onChange={handleImageChange} multiple />
                      {works.length > 0 && (
                          <div>
                          <h2>미리보기</h2>
                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              {works.map((image, index) => (
                              <div key={index} style={{ margin: '8px', position: 'relative' }}>
                                  <img
                                  src={image}
                                  alt={`미리보기 ${index + 1}`}
                                  style={{ maxWidth: '100%', maxHeight: '150px' }}
                                  />
                                  <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  style={{
                                      position: 'absolute',
                                      top: '0',
                                      right: '0',
                                      padding: '4px',
                                      background: 'white',
                                      border: '1px solid #ccc',
                                      cursor: 'pointer',
                                  }}
                                  >
                                  X
                                  </button>
                              </div>
                              ))}
                          </div>
                          </div>
                      )}
                  </div>
                  <div>
                      <h4>bottom embed link (선텍)</h4>
                      <input type="text" placeholder="비메오 영상 임베드 링크"  value={bottomEmbed} onChange={(e)=>setBottomEmbed(e.target.value)}></input>
                  </div>
              </section>
              <section>
                  <h2>디자이너 정보</h2>
                  <div>
                      <h4>introduce-kr</h4>
                      <textarea placeholder="디자이너 소개 - 한글" required value={introductionKr} onChange={(e)=>setIntroductionKr(e.target.value)}/>
                  </div>
                  <div>
                      <h4>introduce-Eng</h4>
                      <textarea placeholder="디자이너 소개 - 영문" required value={introductionEng} onChange={(e)=>setIntroductionEng(e.target.value)}/>
                  </div>
                  <div>
                      <h4>Email</h4>
                      <input type="text" placeholder="본인 이메일" required value={email} onChange={(e)=>setEmail(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>phone number (선택)</h4>
                      <input type="text" placeholder="연락처 또는 다른 연락수단"  value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>instagram link (선택)</h4>
                      <input type="text" placeholder="인스타그램 링크"  value={instagramLink} onChange={(e)=>setInstagramLink(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>web link (선택)</h4>
                      <input type="text" placeholder="블로그 또는 기타 웹 링크"  value={webLink} onChange={(e)=>setWebLink(e.target.value)}></input>
                  </div>
                  <div>
                      <h4>vimeo link (선택)</h4>
                      <input type="text" placeholder="비메오 링크"  value={vimeoLink} onChange={(e)=>setVimeoLink(e.target.value)}></input>
                  </div>
              </section>
              <input type="submit" value={'upload'}/>
              {uploading&&(<h3>업로드 중입니다... 업로드가 완료될때까지 브라우저를 닫지 말아주세요.</h3>)}
          </form>):(
          <div>
              업로드 기간이 아닙니다.
          </div>)}
      </div>
  );
}
