import '../styles/categories.css'
import { NavLink } from 'react-router-dom'

export default function Categorylistcomponents({ categoryicon,
 categoryhead, category1, category2, category3, category4,category5,category6,category7,category8, category10, category11,category12,category13,category14,category15,category9,category16 

}){
  return(

  <div className='categorysub'>
    <div className='categoryhead'>
      <img className='categoryimage' src={categoryicon} alt="" />
      <h3>{categoryhead}</h3>
    </div>
    
  <ul>
      <li> <NavLink to="/"> {category1} </NavLink></li>
      <li> <NavLink to="/"> {category2} </NavLink></li>
      <li> <NavLink to="/"> {category3} </NavLink></li>
      <li> <NavLink to="/"> {category4} </NavLink></li>
      <li> <NavLink to="/"> {category5} </NavLink></li>
      <li> <NavLink to="/"> {category6} </NavLink></li>
      <li> <NavLink to="/"> {category7} </NavLink></li>
      <li> <NavLink to="/"> {category8} </NavLink></li>
      <li> <NavLink to="/"> {category9} </NavLink></li>
      <li> <NavLink to="/"> {category10} </NavLink></li>
      <li> <NavLink to="/"> {category11} </NavLink></li>
      <li> <NavLink to="/"> {category12} </NavLink></li>
      <li> <NavLink to="/"> {category13} </NavLink></li>
      <li> <NavLink to="/"> {category14} </NavLink></li>
      <li> <NavLink to="/"> {category15} </NavLink></li>
      <li> <NavLink to="/"> {category16} </NavLink></li>

  </ul>
  </div>

  )
}


